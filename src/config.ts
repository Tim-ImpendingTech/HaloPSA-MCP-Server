export interface HaloConfig {
  tenantUrl: string;
  tenant: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  scope: string;
  timeoutMs: number;
}

export function loadConfig(): HaloConfig {
  const tenantUrl = requireEnv("HALOPSA_BASE_URL");
  const tenant = requireEnv("HALOPSA_TENANT");
  const clientId = requireEnv("HALOPSA_CLIENT_ID");
  const clientSecret = requireEnv("HALOPSA_CLIENT_SECRET");

  const authUrl =
    process.env.HALOPSA_AUTH_URL || `${tenantUrl.replace(/\/$/, "")}/auth`;
  const scope = process.env.HALOPSA_SCOPE || "all";
  const timeoutMs = parseInt(process.env.HALOPSA_TIMEOUT_MS || "30000", 10);

  return {
    tenantUrl: tenantUrl.replace(/\/$/, ""),
    tenant,
    clientId,
    clientSecret,
    authUrl: authUrl.replace(/\/$/, ""),
    scope,
    timeoutMs,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for configuration details.`
    );
  }
  return value;
}
