import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloSite, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerSiteTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_sites", {
    title: "List Sites",
    description:
      "List HaloPSA sites (locations). Filter by client to see a client's sites.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
      includeinactive: z
        .boolean()
        .optional()
        .describe("Include inactive sites"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloSite>>("/Site", {
        page_size: args.page_size ?? 50,
        page_no: args.page_no ?? 1,
        order: args.order,
        orderdesc: args.orderdesc,
        search: args.search,
        client_id: args.client_id,
        includeinactive: args.includeinactive,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                sites: result.records.map((s) => ({
                  id: s.id,
                  name: s.name,
                  client_id: s.client_id,
                  client_name: s.client_name,
                  phone_number: s.phone_number,
                  inactive: s.inactive,
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

  server.registerTool("halo_get_site", {
    title: "Get Site",
    description: "Get a single HaloPSA site by ID with full details.",
    inputSchema: {
      site_id: z.number().describe("The site ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full site details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloSite>(`/Site/${args.site_id}`, {
        includedetails: args.includedetails ?? true,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_create_site", {
    title: "Create Site",
    description:
      "Create a new HaloPSA site (location) for a client.",
    inputSchema: {
      name: z.string().describe("Site name"),
      client_id: z.number().describe("Client ID this site belongs to"),
      phone_number: z.string().optional().describe("Phone number"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloSite>("/Site", args);
      return {
        content: [
          {
            type: "text",
            text: `Site created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
