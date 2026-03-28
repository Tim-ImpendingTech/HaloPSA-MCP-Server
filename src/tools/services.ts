import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloService } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerServiceTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_services", {
    title: "List Services",
    description:
      "List HaloPSA service catalog entries. Shows managed services, cloud services, hardware services, etc. that clients can subscribe to.",
    inputSchema: {
      ...paginationSchema,
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloService>(
        "/Service",
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
                services: result.records.map((s) => ({
                  id: s.id,
                  name: s.name,
                  summary: s.summary,
                  category: s.service_category_name,
                  subscribers: s.subscriber_count,
                  tracks_status: s.trackstatus,
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

  server.registerTool("halo_get_service", {
    title: "Get Service",
    description:
      "Get a single HaloPSA service catalog entry by ID with full details including subscribers and status tracking.",
    inputSchema: {
      service_id: z.number().describe("The service ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloService>(
        `/Service/${args.service_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
