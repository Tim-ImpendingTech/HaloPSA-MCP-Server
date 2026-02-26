import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import { registerTicketTools } from "./tickets.js";
import { registerActionTools } from "./actions.js";
import { registerClientTools } from "./clients.js";
import { registerAssetTools } from "./assets.js";
import { registerUserTools } from "./users.js";
import { registerSiteTools } from "./sites.js";
import { registerLookupTools } from "./lookup.js";
import { registerKnowledgeBaseTools } from "./knowledge-base.js";
import { registerContractTools } from "./contracts.js";
import { registerProjectTools } from "./projects.js";
import { registerInvoiceTools } from "./invoices.js";
import { registerAppointmentTools } from "./appointments.js";
import { registerSupplierTools } from "./suppliers.js";
import { registerQuotationTools } from "./quotations.js";
import { registerOpportunityTools } from "./opportunities.js";

export function registerAllTools(
  server: McpServer,
  client: HaloApiClient
): void {
  // Phase 1 - Core
  registerTicketTools(server, client);
  registerActionTools(server, client);
  registerClientTools(server, client);
  registerAssetTools(server, client);
  registerUserTools(server, client);

  // Phase 2 - Important
  registerSiteTools(server, client);
  registerLookupTools(server, client);
  registerKnowledgeBaseTools(server, client);

  // Phase 3 - Extended
  registerContractTools(server, client);
  registerProjectTools(server, client);
  registerInvoiceTools(server, client);
  registerAppointmentTools(server, client);
  registerSupplierTools(server, client);
  registerQuotationTools(server, client);
  registerOpportunityTools(server, client);
}
