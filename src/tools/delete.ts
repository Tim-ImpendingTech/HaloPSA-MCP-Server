import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import { errorResult } from "../utils/errors.js";

export function registerDeleteTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_delete_ticket", {
    title: "Delete Ticket",
    description:
      "Delete a HaloPSA ticket by ID. This action is irreversible. You must set confirm=true to proceed.",
    inputSchema: {
      ticket_id: z.number().describe("The ticket ID to delete"),
      confirm: z
        .boolean()
        .describe("Must be true to confirm deletion"),
    },
  }, async (args) => {
    if (args.confirm !== true) {
      return {
        content: [
          {
            type: "text",
            text: "You must set confirm: true to delete a ticket. This action is irreversible.",
          },
        ],
      };
    }
    try {
      await client.delete(`/Tickets/${args.ticket_id}`);
      return {
        content: [
          {
            type: "text",
            text: `Ticket ${args.ticket_id} deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_delete_action", {
    title: "Delete Action",
    description:
      "Delete a HaloPSA action (note/update) by ID. This action is irreversible. You must set confirm=true to proceed.",
    inputSchema: {
      action_id: z.number().describe("The action ID to delete"),
      confirm: z
        .boolean()
        .describe("Must be true to confirm deletion"),
    },
  }, async (args) => {
    if (args.confirm !== true) {
      return {
        content: [
          {
            type: "text",
            text: "You must set confirm: true to delete an action. This action is irreversible.",
          },
        ],
      };
    }
    try {
      await client.delete(`/Actions/${args.action_id}`);
      return {
        content: [
          {
            type: "text",
            text: `Action ${args.action_id} deleted successfully.`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
