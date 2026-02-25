import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloClient, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerClientTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_clients", {
    title: "List Clients",
    description:
      "List HaloPSA clients (organizations/companies). Use search to filter by name.",
    inputSchema: {
      ...paginationSchema,
      toplevel_id: z
        .number()
        .optional()
        .describe("Filter by top-level/parent organization ID"),
      includeinactive: z
        .boolean()
        .optional()
        .describe("Include inactive clients"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloClient>>(
        "/Client",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          toplevel_id: args.toplevel_id,
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
                clients: result.records.map((c) => ({
                  id: c.id,
                  name: c.name,
                  phone_number: c.phone_number,
                  email: c.email,
                  inactive: c.inactive,
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

  server.registerTool("halo_get_client", {
    title: "Get Client",
    description: "Get a single HaloPSA client by ID with full details.",
    inputSchema: {
      client_id: z.number().describe("The client ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full client details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloClient>(
        `/Client/${args.client_id}`,
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

  server.registerTool("halo_create_client", {
    title: "Create Client",
    description: "Create a new HaloPSA client (organization/company).",
    inputSchema: {
      name: z.string().describe("Client name"),
      toplevel_id: z
        .number()
        .optional()
        .describe("Parent organization ID"),
      phone_number: z.string().optional().describe("Phone number"),
      email: z.string().optional().describe("Email address"),
      website: z.string().optional().describe("Website URL"),
      notes: z.string().optional().describe("Notes about the client"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloClient>("/Client", args);
      return {
        content: [
          {
            type: "text",
            text: `Client created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_update_client", {
    title: "Update Client",
    description: "Update an existing HaloPSA client.",
    inputSchema: {
      id: z.number().describe("Client ID to update"),
      name: z.string().optional().describe("Updated client name"),
      phone_number: z.string().optional().describe("Updated phone number"),
      email: z.string().optional().describe("Updated email address"),
      website: z.string().optional().describe("Updated website URL"),
      notes: z.string().optional().describe("Updated notes"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloClient>("/Client", args);
      return {
        content: [
          {
            type: "text",
            text: `Client ${args.id} updated successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
