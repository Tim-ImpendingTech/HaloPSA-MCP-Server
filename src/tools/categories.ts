import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloCategory } from "../client/types.js";
import { errorResult } from "../utils/errors.js";

export function registerCategoryTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_categories", {
    title: "List Categories",
    description:
      "List all HaloPSA ticket categories. Useful for finding valid category values when creating tickets. Filter by ticket type to see categories available for that type.",
    inputSchema: {
      type_id: z
        .number()
        .optional()
        .describe("Filter by ticket type ID (e.g. 1=Incident, 3=Service Request). Returns only categories valid for that type."),
    },
  }, async (args) => {
    try {
      const params: Record<string, unknown> = {};
      if (args.type_id !== undefined) params.type_id = args.type_id;
      const result = await client.getList<HaloCategory>(
        "/Category",
        params
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                categories: result.records.map((c) => ({
                  id: c.id,
                  value: c.value,
                  type_id: c.type_id,
                  sla_id: c.sla_id,
                  priority_id: c.priority_id,
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
