import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloTeam, HaloStatus, HaloListResponse } from "../client/types.js";
import { errorResult } from "../utils/errors.js";

export function registerLookupTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_statuses", {
    title: "List Statuses",
    description:
      "List all HaloPSA ticket statuses. Useful for finding status IDs when creating or updating tickets.",
    inputSchema: {
      type: z
        .number()
        .optional()
        .describe("Filter by ticket type ID to get type-specific statuses"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloStatus>>(
        "/Status",
        { type: args.type }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                statuses: result.records.map((s) => ({
                  id: s.id,
                  name: s.name,
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

  server.registerTool("halo_list_teams", {
    title: "List Teams",
    description:
      "List all HaloPSA teams. Useful for finding team IDs when assigning tickets.",
    inputSchema: {},
  }, async () => {
    try {
      const result = await client.get<HaloListResponse<HaloTeam>>("/Team");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                teams: result.records.map((t) => ({
                  id: t.id,
                  name: t.name,
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

  server.registerTool("halo_list_ticket_types", {
    title: "List Ticket Types",
    description:
      "List all HaloPSA ticket types. Useful for finding tickettype_id when creating tickets.",
    inputSchema: {},
  }, async () => {
    try {
      const result = await client.get<HaloListResponse<{ id: number; name: string }>>(
        "/TicketType"
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                ticket_types: result.records.map((t) => ({
                  id: t.id,
                  name: t.name,
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

  server.registerTool("halo_list_priorities", {
    title: "List Priorities",
    description:
      "List all HaloPSA priorities. Useful for finding priority_id when creating or updating tickets.",
    inputSchema: {},
  }, async () => {
    try {
      const result = await client.get<HaloListResponse<{ id: number; name: string }>>(
        "/Priority"
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                priorities: result.records.map((p) => ({
                  id: p.id,
                  name: p.name,
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
}
