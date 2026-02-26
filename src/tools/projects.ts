import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloProject, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerProjectTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_projects", {
    title: "List Projects",
    description:
      "List HaloPSA projects. Filter by client to see a client's projects.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloProject>>(
        "/Projects",
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
                projects: result.records.map((p) => ({
                  id: p.id,
                  summary: p.summary,
                  client_name: p.client_name,
                  status: p.status,
                  dateoccurred: p.dateoccurred,
                  deadlinedate: p.deadlinedate,
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

  server.registerTool("halo_get_project", {
    title: "Get Project",
    description:
      "Get a single HaloPSA project by ID with full details.",
    inputSchema: {
      project_id: z.number().describe("The project ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full project details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloProject>(
        `/Projects/${args.project_id}`,
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

  server.registerTool("halo_create_project", {
    title: "Create Project",
    description: "Create a new HaloPSA project.",
    inputSchema: {
      summary: z.string().describe("Project name/summary"),
      client_id: z.number().optional().describe("Client ID"),
      deadlinedate: z
        .string()
        .optional()
        .describe("Deadline date (ISO 8601)"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloProject>("/Projects", args);
      return {
        content: [
          {
            type: "text",
            text: `Project created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_update_project", {
    title: "Update Project",
    description: "Update an existing HaloPSA project.",
    inputSchema: {
      id: z.number().describe("Project ID to update"),
      summary: z.string().optional().describe("Updated project summary"),
      client_id: z.number().optional().describe("Updated client ID"),
      deadlinedate: z
        .string()
        .optional()
        .describe("Updated deadline date (ISO 8601)"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloProject>("/Projects", args);
      return {
        content: [
          {
            type: "text",
            text: `Project ${args.id} updated successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
