import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloSupplier, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerSupplierTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_suppliers", {
    title: "List Suppliers",
    description: "List HaloPSA suppliers.",
    inputSchema: {
      ...paginationSchema,
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloSupplier>>(
        "/Supplier",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                suppliers: result.records.map((s) => ({
                  id: s.id,
                  name: s.name,
                  phone_number: s.phone_number,
                  email: s.email,
                  website: s.website,
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

  server.registerTool("halo_get_supplier", {
    title: "Get Supplier",
    description:
      "Get a single HaloPSA supplier by ID with full details.",
    inputSchema: {
      supplier_id: z.number().describe("The supplier ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloSupplier>(
        `/Supplier/${args.supplier_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
