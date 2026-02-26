import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloQuotation, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerQuotationTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_quotations", {
    title: "List Quotations",
    description: "List HaloPSA quotations. Filter by client.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloQuotation>>(
        "/Quotation",
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
                quotations: result.records.map((q) => ({
                  id: q.id,
                  client_name: q.client_name,
                  status: q.status,
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

  server.registerTool("halo_get_quotation", {
    title: "Get Quotation",
    description:
      "Get a single HaloPSA quotation by ID with full details.",
    inputSchema: {
      quotation_id: z.number().describe("The quotation ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloQuotation>(
        `/Quotation/${args.quotation_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
