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
      "List HaloPSA Integration Runbooks (internally 'Webhooks') from the repository. NOTE: Halo's Services-auth API apps only see shipped library-template runbooks (Azure OpenAI, OpenAI Suggestions, etc.) via /WebhookRepository — tenant-customized runbooks created in your instance are not returned here. This tool is mainly useful for payload discovery: read a library template to learn the JSON shape, then use halo_create_runbook. To inspect your own runbooks, use the Halo admin UI under Config → Integrations → Custom Integrations → Integration Runbooks.",
    inputSchema: {
      search: z.string().optional().describe("Substring match on runbook name"),
    },
  }, async (args) => {
    try {
      const result = await client.getList<Record<string, unknown>>("/WebhookRepository", {
        search: args.search,
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
      "Fetch a single runbook from Halo's library repository by id, returning its full JSON including steps and configuration. NOTE: This reads from /WebhookRepository (library templates only) — it will 404 on runbooks created in your own tenant, which are not exposed to Services-auth API apps. Primary use: payload discovery — clone a library template's structure when calling halo_create_runbook.",
    inputSchema: {
      id: z.string().describe("Runbook UUID (from halo_list_runbooks)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<Record<string, unknown>>(`/WebhookRepository/${args.id}`);
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
      "Create a HaloPSA Integration Runbook via POST /Webhook. Write path is confirmed working. Payload is forwarded to Halo as-is; the caller owns the JSON shape. Recommended workflow: call halo_list_runbooks + halo_get_runbook on a library template first to learn the structure, then mirror it. Halo validates server-side; 400 errors are surfaced verbatim. NOTE: after creation, the runbook may not appear via halo_list_runbooks or halo_get_runbook (Halo filters tenant-created runbooks from Services-auth reads) — verify in the Halo admin UI. Save the returned `id` — you'll need it for halo_delete_runbook if you want to undo.",
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
