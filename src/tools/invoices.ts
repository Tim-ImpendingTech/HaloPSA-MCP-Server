import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloInvoice } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerInvoiceTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_invoices", {
    title: "List Invoices",
    description:
      "List HaloPSA invoices. Filter by client, status, or date range.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
      status: z.string().optional().describe("Filter by invoice status"),
      date_from: z.string().optional().describe("Filter invoices from this date (ISO 8601)"),
      date_to: z.string().optional().describe("Filter invoices up to this date (ISO 8601)"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloInvoice>(
        "/Invoice",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          client_id: args.client_id,
          status: args.status,
          date_from: args.date_from,
          date_to: args.date_to,
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
                  client_name: i.client_name,
                  invoice_number: i.invoicenumber,
                  date: (i as Record<string, unknown>).date,
                  due_date: i.datedue,
                  total: i.total,
                  status: i.status,
                  paid_amount: (i as Record<string, unknown>).paid_amount,
                  outstanding_amount: (i as Record<string, unknown>).outstanding_amount,
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

  server.registerTool("halo_get_invoice_details", {
    title: "Get Invoice Details",
    description:
      "Get a HaloPSA invoice by ID with header info and line items trimmed to key fields.",
    inputSchema: {
      invoice_id: z.number().describe("The invoice ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<Record<string, unknown>>(
        `/Invoice/${args.invoice_id}`,
        {
          includedetails: true,
        }
      );
      const lines = Array.isArray(result.lines) ? result.lines : [];
      const trimmed = {
        id: result.id,
        invoice_number: result.invoicenumber,
        client_name: result.client_name,
        date: result.date,
        due_date: result.datedue,
        total: result.total,
        tax: result.tax,
        status: result.status,
        paid_amount: result.paid_amount,
        outstanding_amount: result.outstanding_amount,
        line_items: (lines as Record<string, unknown>[]).map((l) => ({
          id: l.id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price ?? l.unitprice,
          total: l.total,
          tax: l.tax,
        })),
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(trimmed, null, 2),
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_create_invoice", {
    title: "Create Invoice",
    description:
      "Create a new HaloPSA invoice for a client, optionally from specific tickets or a date range.",
    inputSchema: {
      client_id: z.number().describe("Client ID to create the invoice for"),
      ticket_ids: z
        .array(z.number())
        .optional()
        .describe("Array of ticket IDs to include on the invoice"),
      date_from: z
        .string()
        .optional()
        .describe("Include unbilled time from this date (ISO 8601)"),
      date_to: z
        .string()
        .optional()
        .describe("Include unbilled time up to this date (ISO 8601)"),
      notes: z.string().optional().describe("Notes to add to the invoice"),
    },
  }, async (args) => {
    try {
      const body: Record<string, unknown> = {
        client_id: args.client_id,
      };
      if (args.ticket_ids) body.ticket_ids = args.ticket_ids;
      if (args.date_from) body.date_from = args.date_from;
      if (args.date_to) body.date_to = args.date_to;
      if (args.notes) body.note = args.notes;

      const result = await client.post<Record<string, unknown>>(
        "/Invoice",
        body
      );
      const summary = {
        id: result.id,
        invoice_number: result.invoicenumber,
        client_name: result.client_name,
        date: result.date,
        due_date: result.datedue,
        total: result.total,
        status: result.status,
      };
      return {
        content: [
          {
            type: "text",
            text: `Invoice created successfully:\n${JSON.stringify(summary, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
