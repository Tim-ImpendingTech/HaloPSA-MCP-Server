import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloAgent, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerUserTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_agents", {
    title: "List Agents",
    description:
      "List HaloPSA agents (technicians/staff). Use search to filter by name.",
    inputSchema: {
      ...paginationSchema,
      team_id: z.number().optional().describe("Filter by team ID"),
      includeenabled: z
        .boolean()
        .optional()
        .describe("Only include enabled agents (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloAgent>>(
        "/Agent",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          team_id: args.team_id,
          includeenabled: args.includeenabled ?? true,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                agents: result.records.map((a) => ({
                  id: a.id,
                  name: a.name,
                  email: a.email,
                  team: a.team,
                  is_disabled: a.is_disabled,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_get_agent", {
    title: "Get Agent",
    description:
      "Get a single HaloPSA agent by ID with full details.",
    inputSchema: {
      agent_id: z.number().describe("The agent ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full agent details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloAgent>(
        `/Agent/${args.agent_id}`,
        {
          includedetails: args.includedetails ?? true,
        }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
