import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import { errorResult } from "../utils/errors.js";

export function registerRunbookTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_runbooks", {
    title: "List Runbooks",
    description:
      "List HaloPSA Integration Runbooks (internally called 'Webhooks'). Use search to filter by name. Returns an array of runbook summaries. Call halo_get_runbook on an id to fetch the full definition — useful as a template for halo_create_runbook.",
    inputSchema: {
      search: z.string().optional().describe("Substring match on runbook name"),
      page_size: z.number().optional().describe("Results per page (default 50)"),
      page_no: z.number().optional().describe("Page number (default 1)"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<Record<string, unknown>>("/Webhook", {
        search: args.search,
        page_size: args.page_size ?? 50,
        page_no: args.page_no ?? 1,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_get_runbook", {
    title: "Get Runbook",
    description:
      "Fetch a single HaloPSA Integration Runbook (Webhook) by id, returning its full JSON including variables, steps, events, and all other fields. Useful as a template for halo_create_runbook — clone a similar existing runbook's JSON structure.",
    inputSchema: {
      id: z.string().describe("Runbook UUID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<Record<string, unknown>>(`/Webhook/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_create_runbook", {
    title: "Create Runbook",
    description:
      "Create a HaloPSA Integration Runbook (Webhook) from a raw JSON payload. The runbook object is forwarded to Halo as-is; the caller owns the JSON shape. Recommended workflow: call halo_list_runbooks + halo_get_runbook on a similar existing runbook first, then mirror its structure. Halo validates server-side; 400 errors are surfaced verbatim.",
    inputSchema: {
      runbook: z
        .object({})
        .passthrough()
        .describe(
          "Full Halo runbook JSON object. At minimum include name (string) and enabled (bool). Add variables, steps, events, etc. as needed. See halo_get_runbook output for the full shape."
        ),
    },
  }, async (args) => {
    try {
      const result = await client.post<Record<string, unknown>>("/Webhook", args.runbook);
      return {
        content: [{ type: "text", text: `Runbook created:\n${JSON.stringify(result, null, 2)}` }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_delete_runbook", {
    title: "Delete Runbook",
    description:
      "Delete a HaloPSA Integration Runbook (Webhook) by id. This action is irreversible. You must set confirm=true to proceed.",
    inputSchema: {
      id: z.string().describe("Runbook UUID"),
      confirm: z.boolean().describe("Must be true to confirm deletion"),
    },
  }, async (args) => {
    if (args.confirm !== true) {
      return {
        content: [{
          type: "text",
          text: "You must set confirm: true to delete a runbook. This action is irreversible.",
        }],
      };
    }
    try {
      await client.delete(`/Webhook/${args.id}`);
      return {
        content: [{
          type: "text",
          text: `Runbook ${args.id} deleted successfully.`,
        }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
