import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloAppointment, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerAppointmentTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_appointments", {
    title: "List Appointments",
    description:
      "List HaloPSA appointments. Filter by agent, ticket, or client.",
    inputSchema: {
      ...paginationSchema,
      agent_id: z.number().optional().describe("Filter by agent ID"),
      ticket_id: z.number().optional().describe("Filter by ticket ID"),
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloAppointment>>(
        "/Appointment",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
          agent_id: args.agent_id,
          ticket_id: args.ticket_id,
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
                appointments: result.records.map((a) => ({
                  id: a.id,
                  subject: a.subject,
                  start_date: a.start_date,
                  end_date: a.end_date,
                  agent_id: a.agent_id,
                  ticket_id: a.ticket_id,
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

  server.registerTool("halo_get_appointment", {
    title: "Get Appointment",
    description:
      "Get a single HaloPSA appointment by ID with full details.",
    inputSchema: {
      appointment_id: z.number().describe("The appointment ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloAppointment>(
        `/Appointment/${args.appointment_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_create_appointment", {
    title: "Create Appointment",
    description:
      "Create a new HaloPSA appointment.",
    inputSchema: {
      subject: z.string().optional().describe("Appointment subject"),
      start_date: z.string().describe("Start date/time (ISO 8601)"),
      end_date: z.string().describe("End date/time (ISO 8601)"),
      agent_id: z.number().optional().describe("Agent ID"),
      ticket_id: z.number().optional().describe("Linked ticket ID"),
      client_id: z.number().optional().describe("Client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloAppointment>(
        "/Appointment",
        args
      );
      return {
        content: [
          {
            type: "text",
            text: `Appointment created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
