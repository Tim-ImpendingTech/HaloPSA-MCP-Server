import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloRecurringInvoice } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerRecurringInvoiceTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_recurring_invoices", {
    title: "List Recurring Invoices",
    description:
      "List HaloPSA recurring invoices. These are scheduled invoices for managed services and contracts.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloRecurringInvoice>(
        "/RecurringInvoice",
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
                recurring_invoices: result.records.map((ri) => ({
                  id: ri.id,
                  client_id: ri.client_id,
                  client_name: ri.client_name,
                  total: ri.total,
                  contract_id: ri.contract_id,
                  contract_ref: ri.contract_ref,
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

  server.registerTool("halo_get_recurring_invoice", {
    title: "Get Recurring Invoice",
    description:
      "Get a single HaloPSA recurring invoice by ID with full details including line items.",
    inputSchema: {
      recurring_invoice_id: z.number().describe("The recurring invoice ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloRecurringInvoice>(
        `/RecurringInvoice/${args.recurring_invoice_id}`,
        { includedetails: true }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
