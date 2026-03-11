import type { HaloConfig } from "../config.js";
import type { OAuthTokenResponse, HaloListResponse } from "./types.js";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function wrapFetchError(error: unknown, context: string): Error {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.message.includes("timeout")) {
      return new Error(`${context}: Request timed out. Check HALOPSA_BASE_URL and network connectivity.`);
    }
    if (error.message === "fetch failed" || error.cause) {
      const cause = error.cause instanceof Error ? error.cause.message : "";
      return new Error(`${context}: Could not connect to HaloPSA (${cause || "network error"}). Verify HALOPSA_BASE_URL is correct and the server is reachable.`);
    }
    return new Error(`${context}: ${error.message}`);
  }
  return new Error(`${context}: ${String(error)}`);
}

/**
 * HaloPSA list endpoints do not return a generic "records" array.
 * Instead each endpoint returns its data under an endpoint-specific key.
 * Additionally, some lookup endpoints (Agent, Status, Team, Priority,
 * TicketType) omit "record_count" entirely, or return a raw JSON array
 * rather than a wrapped object.
 *
 * This function normalises ALL of those response shapes into:
 *   { record_count: number, records: T[] }
 * so that every tool handler can use result.records consistently.
 *
 * Cases handled:
 *   1. Raw array          → { record_count: arr.length, records: arr }
 *   2. { record_count, <key>: [...] }  (standard endpoints, already worked)
 *   3. { <key>: [...] }  (lookup endpoints, missing record_count - was broken)
 *   4. { record_count, records: [...] }  → pass-through (already correct)
 *   5. Object with no array key at all  → { records: [] }
 */
function normalizeListResponse<T>(json: unknown): T {
  // Case 1: raw array response (some lookup endpoints return bare arrays)
  if (Array.isArray(json)) {
    return {
      record_count: json.length,
      records: json,
    } as T;
  }

  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>;

    // Case 4: already normalised - pass through unchanged
    if ("records" in obj) {
      return json as T;
    }

    // Cases 2 & 3: find whichever key holds the data array
    const arrayKey = Object.keys(obj).find(
      (k) => k !== "record_count" && Array.isArray(obj[k])
    );

    if (arrayKey) {
      obj["records"] = obj[arrayKey];
    } else {
      // Case 5: no array found - return empty so .map() never throws
      obj["records"] = [];
    }

    // Synthesise record_count if the endpoint didn't include it
    if (!("record_count" in obj)) {
      obj["record_count"] = (obj["records"] as unknown[]).length;
    }
  }

  return json as T;
}

export class HaloApiClient {
  private config: HaloConfig;
  private cachedToken: CachedToken | null = null;

  constructor(config: HaloConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (
      this.cachedToken &&
      Date.now() < this.cachedToken.expiresAt - 60_000
    ) {
      return this.cachedToken.accessToken;
    }

    const tokenUrl = `${this.config.authUrl}/token?tenant=${encodeURIComponent(this.config.tenant)}`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope,
    });

    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw wrapFetchError(error, "HaloPSA authentication failed");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HaloPSA authentication failed (${response.status}): ${text}`
      );
    }

    const data = (await response.json()) as OAuthTokenResponse;

    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.authenticate();
    const url = new URL(`${this.config.tenantUrl}/api${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw wrapFetchError(error, `HaloPSA API error GET ${path}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HaloPSA API error GET ${path} (${response.status}): ${text}`
      );
    }

    const json = await response.json();
    return normalizeListResponse<T>(json);
  }

  async post<T = unknown>(
    path: string,
    body: unknown
  ): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.config.tenantUrl}/api${path}`;

    // HaloPSA convention: POST bodies are wrapped in arrays
    const payload = Array.isArray(body) ? body : [body];

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw wrapFetchError(error, `HaloPSA API error POST ${path}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HaloPSA API error POST ${path} (${response.status}): ${text}`
      );
    }

    return (await response.json()) as T;
  }

  async delete(path: string): Promise<void> {
    const token = await this.authenticate();
    const url = `${this.config.tenantUrl}/api${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw wrapFetchError(error, `HaloPSA API error DELETE ${path}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HaloPSA API error DELETE ${path} (${response.status}): ${text}`
      );
    }
  }
}
