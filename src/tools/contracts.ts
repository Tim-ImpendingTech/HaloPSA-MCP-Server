import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloContract, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerContractTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_list_contracts", {
    title: "List Contracts",
    description:
      "List HaloPSA client contracts. Filter by client to see a client's contracts.",
    inputSchema: {
      ...paginationSchema,
      client_id: z.number().optional().describe("Filter by client ID"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloContract>>(
        "/ClientContract",
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
                contracts: result.records.map((c) => ({
                  id: c.id,
                  ref: c.ref,
                  client_name: c.client_name,
                  type: c.type,
                  startdate: c.startdate,
                  enddate: c.enddate,
                  billing_cycle: c.billing_cycle,
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

  server.registerTool("halo_get_contract", {
    title: "Get Contract",
    description:
      "Get a single HaloPSA contract by ID with full details.",
    inputSchema: {
      contract_id: z.number().describe("The contract ID to retrieve"),
      includedetails: z
        .boolean()
        .optional()
        .describe("Include full contract details (default true)"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloContract>(
        `/ClientContract/${args.contract_id}`,
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
}
