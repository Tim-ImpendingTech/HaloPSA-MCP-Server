import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloAsset, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerAssetTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_assets", {
    title: "List Assets",
    description:
      "List HaloPSA assets (devices, equipment, configuration items). Filter by client, site, user, or asset type.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
      site_id: z.number().optional().describe("Filter by site ID"),
      user_id: z.number().optional().describe("Filter by user ID"),
      assettype_id: z.number().optional().describe("Filter by asset type ID"),
      includeinactive: z
        .boolean()
        .optional()
        .describe("Include inactive assets"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloAsset>>(
        "/Asset",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          client_id: args.client_id,
          site_id: args.site_id,
          user_id: args.user_id,
          assettype_id: args.assettype_id,
          includeinactive: args.includeinactive,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                assets: result.records.map((a) => ({
                  id: a.id,
                  inventory_number: a.inventory_number,
                  key_field: a.key_field,
                  client_name: a.client_name,
                  user_name: a.user_name,
                  assettype_name: a.assettype_name,
                  inactive: a.inactive,
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

  server.registerTool("halo_get_asset", {
    title: "Get Asset",
    description: "Get a single HaloPSA asset by ID with full details.",
    inputSchema: {
      asset_id: z.number().describe("The asset ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full asset details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloAsset>(
        `/Asset/${args.asset_id}`,
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

  server.registerTool("halo_create_asset", {
    title: "Create Asset",
    description: "Create a new HaloPSA asset (device, equipment, CI).",
    inputSchema: {
      inventory_number: z
        .string()
        .optional()
        .describe("Asset inventory/serial number"),
      client_id: z.number().optional().describe("Owner client ID"),
      site_id: z.number().optional().describe("Site ID"),
      user_id: z.number().optional().describe("Assigned user ID"),
      assettype_id: z.number().optional().describe("Asset type ID"),
      key_field: z
        .string()
        .optional()
        .describe("Primary key field (e.g. hostname)"),
      key_field2: z.string().optional().describe("Secondary key field"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloAsset>("/Asset", args);
      return {
        content: [
          {
            type: "text",
            text: `Asset created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_update_asset", {
    title: "Update Asset",
    description: "Update an existing HaloPSA asset.",
    inputSchema: {
      id: z.number().describe("Asset ID to update"),
      inventory_number: z
        .string()
        .optional()
        .describe("Updated inventory/serial number"),
      client_id: z.number().optional().describe("Updated client ID"),
      site_id: z.number().optional().describe("Updated site ID"),
      user_id: z.number().optional().describe("Updated user ID"),
      assettype_id: z.number().optional().describe("Updated asset type ID"),
      key_field: z.string().optional().describe("Updated primary key field"),
      key_field2: z.string().optional().describe("Updated secondary key field"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloAsset>("/Asset", args);
      return {
        content: [
          {
            type: "text",
            text: `Asset ${args.id} updated successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
