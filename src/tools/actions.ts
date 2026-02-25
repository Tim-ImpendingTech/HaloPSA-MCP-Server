import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloAction, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerActionTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_actions", {
    title: "List Ticket Actions",
    description:
      "List actions (notes, updates, emails) on a specific HaloPSA ticket. Actions are the activity feed/timeline of a ticket.",
    inputSchema: {
      ticket_id: z.number().describe("Ticket ID to list actions for"),
      ...paginationSchema,
      excludesys: z
        .boolean()
        .optional()
        .describe("Exclude system-generated actions"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloAction>>(
        "/Actions",
        {
          ticket_id: args.ticket_id,
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          excludesys: args.excludesys,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                ticket_id: args.ticket_id,
                actions: result.records.map((a) => ({
                  id: a.id,
                  who: a.who,
                  note: a.note,
                  outcome: a.outcome,
                  datetimestamp: a.datetimestamp,
                  hiddenfromuser: a.hiddenfromuser,
                  timetaken: a.timetaken,
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

  server.registerTool("halo_create_action", {
    title: "Create Ticket Action",
    description:
      "Add an action (note, reply, update) to a HaloPSA ticket. Use this to add notes, send emails, log time, or update ticket status.",
    inputSchema: {
      ticket_id: z.number().describe("Ticket ID to add action to"),
      note: z.string().describe("The note/content of the action"),
      outcome: z
        .string()
        .optional()
        .describe("Outcome type (e.g. 'Note', 'Email')"),
      outcome_id: z.number().optional().describe("Outcome ID"),
      hiddenfromuser: z
        .boolean()
        .optional()
        .describe("Hide this action from the end user (private note)"),
      sendemail: z
        .boolean()
        .optional()
        .describe("Send email notification for this action"),
      emailto: z
        .string()
        .optional()
        .describe("Email recipient (if sending email)"),
      timetaken: z
        .number()
        .optional()
        .describe("Time taken in minutes"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloAction>("/Actions", {
        ticket_id: args.ticket_id,
        note: args.note,
        outcome: args.outcome,
        outcome_id: args.outcome_id,
        hiddenfromuser: args.hiddenfromuser,
        sendemail: args.sendemail,
        emailto: args.emailto,
        timetaken: args.timetaken,
      });
      return {
        content: [
          {
            type: "text",
            text: `Action added to ticket ${args.ticket_id}:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
