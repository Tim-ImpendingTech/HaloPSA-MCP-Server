import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloItem } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerItemTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_items", {
    title: "List Items",
    description:
      "List HaloPSA billable items/products. These are line items used on invoices, quotes, and sales orders.",
    inputSchema: {
      ...paginationSchema,
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloItem>(
        "/Item",
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
                items: result.records.map((i) => ({
                  id: i.id,
                  name: i.name,
                  baseprice: i.baseprice,
                  costprice: i.costprice,
                  nominalcode: i.nominalcode,
                  assetgroup_name: i.assetgroup_name,
                  supplier_name: i.supplier_name,
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

  server.registerTool("halo_get_item", {
    title: "Get Item",
    description:
      "Get a single HaloPSA item/product by ID with full details.",
    inputSchema: {
      item_id: z.number().describe("The item ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloItem>(
        `/Item/${args.item_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
