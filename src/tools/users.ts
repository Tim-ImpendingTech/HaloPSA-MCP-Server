import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloAgent, HaloUser } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerUserTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_agents", {
    title: "List Agents",
    description:
      "List HaloPSA agents (technicians/staff). Use search to filter by name.",
    inputSchema: {
      ...paginationSchema,
      team_id: z.number().optional().describe("Filter by team ID"),
      includeenabled: z
        .boolean()
        .optional()
        .describe("Only include enabled agents (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloAgent>(
        "/Agent",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          team_id: args.team_id,
          includeenabled: args.includeenabled ?? true,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                agents: result.records.map((a) => ({
                  id: a.id,
                  name: a.name,
                  email: a.email,
                  team: a.team,
                  is_disabled: a.is_disabled,
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

  server.registerTool("halo_get_agent", {
    title: "Get Agent",
    description:
      "Get a single HaloPSA agent by ID with full details.",
    inputSchema: {
      agent_id: z.number().describe("The agent ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full agent details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloAgent>(
        `/Agent/${args.agent_id}`,
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

  // --- End-User / Contact Tools ---

  server.registerTool("halo_list_users", {
    title: "List Users",
    description:
      "List HaloPSA end-users (contacts/customers, not agents). Filter by client, site, or search by name/email.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
      site_id: z.number().optional().describe("Filter by site ID"),
      includeinactive: z.boolean().optional().describe("Include inactive users"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<HaloUser>(
        "/Users",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          client_id: args.client_id,
          site_id: args.site_id,
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
                users: result.records.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.emailaddress,
                  phone: u.phonenumber,
                  client_name: u.client_name,
                  site_name: u.site_name,
                  inactive: u.inactive,
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

  server.registerTool("halo_get_user", {
    title: "Get User",
    description:
      "Get a single HaloPSA end-user (contact) by ID with full details.",
    inputSchema: {
      user_id: z.number().describe("The user ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloUser>(
        `/Users/${args.user_id}`,
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
