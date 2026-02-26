#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { HaloApiClient } from "./client/halo-api-client.js";
import { registerAllTools } from "./tools/index.js";

async function main() {
  const config = loadConfig();

  const server = new McpServer({
    name: "halopsa-mcp-server",
    version: "1.0.0",
  });

  const apiClient = new HaloApiClient(config);

  registerAllTools(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (never stdout - it's used for JSON-RPC)
  console.error("HaloPSA MCP Server started successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
