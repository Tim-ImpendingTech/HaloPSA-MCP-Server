import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloOpportunity, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerOpportunityTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_opportunities", {
    title: "List Opportunities",
    description: "List HaloPSA opportunities (sales pipeline). Filter by client.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloOpportunity>>(
        "/Opportunities",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          client_id: args.client_id,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                opportunities: result.records.map((o) => ({
                  id: o.id,
                  summary: o.summary,
                  client_name: o.client_name,
                  value: o.value,
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

  server.registerTool("halo_get_opportunity", {
    title: "Get Opportunity",
    description:
      "Get a single HaloPSA opportunity by ID with full details.",
    inputSchema: {
      opportunity_id: z.number().describe("The opportunity ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloOpportunity>(
        `/Opportunities/${args.opportunity_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
