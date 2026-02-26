import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloInvoice, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerInvoiceTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_invoices", {
    title: "List Invoices",
    description:
      "List HaloPSA invoices. Filter by client to see a client's invoices.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloInvoice>>(
        "/Invoice",
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
                invoices: result.records.map((i) => ({
                  id: i.id,
                  invoicenumber: i.invoicenumber,
                  client_name: i.client_name,
                  datedue: i.datedue,
                  total: i.total,
                  status: i.status,
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

  server.registerTool("halo_get_invoice", {
    title: "Get Invoice",
    description:
      "Get a single HaloPSA invoice by ID with full details.",
    inputSchema: {
      invoice_id: z.number().describe("The invoice ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full invoice details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloInvoice>(
        `/Invoice/${args.invoice_id}`,
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
