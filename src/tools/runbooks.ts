import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import { errorResult } from "../utils/errors.js";

export function registerRunbookTools(
  server: McpServer,
  client: HaloApiClient
): void {
  // Tools added in subsequent tasks.
  void server;
  void client;
}
