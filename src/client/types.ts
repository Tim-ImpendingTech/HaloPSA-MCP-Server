export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface HaloListResponse<T> {
  record_count: number;
  records: T[];
}

export interface HaloTicket {
  id: number;
  summary: string;
  details: string;
  tickettype_id: number;
  client_id: number;
  client_name?: string;
  site_id?: number;
  user_id?: number;
  user_name?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team?: string;
  status_id: number;
  status?: string;
  priority_id?: number;
  priority?: string;
  category_1?: string;
  category_2?: string;
  category_3?: string;
  sla_id?: number;
  dateoccurred?: string;
  datecreated?: string;
  deadlinedate?: string;
  reportedby?: number;
  [key: string]: unknown;
}

export interface HaloAction {
  id: number;
  ticket_id: number;
  who: string;
  who_agentid?: number;
  note: string;
  note_html?: string;
  outcome: string;
  outcome_id?: number;
  sendemail?: boolean;
  emailfrom?: string;
  emailto?: string;
  hiddenfromuser?: boolean;
  timetaken?: number;
  datetimestamp?: string;
  [key: string]: unknown;
}

export interface HaloClient {
  id: number;
  name: string;
  toplevel_id?: number;
  is_vip?: boolean;
  colour?: string;
  inactive?: boolean;
  main_site_id?: number;
  website?: string;
  phone_number?: string;
  email?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface HaloAsset {
  id: number;
  inventory_number?: string;
  client_id?: number;
  client_name?: string;
  site_id?: number;
  user_id?: number;
  user_name?: string;
  assettype_id?: number;
  assettype_name?: string;
  key_field?: string;
  key_field2?: string;
  inactive?: boolean;
  [key: string]: unknown;
}

export interface HaloAgent {
  id: number;
  name: string;
  email?: string;
  team?: string;
  team_id?: number;
  is_disabled?: boolean;
  role?: string;
  [key: string]: unknown;
}

export interface HaloSite {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  phone_number?: string;
  colour?: string;
  inactive?: boolean;
  [key: string]: unknown;
}

export interface HaloContract {
  id: number;
  ref?: string;
  client_id: number;
  client_name?: string;
  type?: string;
  startdate?: string;
  enddate?: string;
  billing_cycle?: string;
  [key: string]: unknown;
}

export interface HaloProject {
  id: number;
  summary: string;
  client_id?: number;
  client_name?: string;
  status?: string;
  dateoccurred?: string;
  deadlinedate?: string;
  [key: string]: unknown;
}

export interface HaloInvoice {
  id: number;
  client_id: number;
  client_name?: string;
  invoicenumber?: string;
  datedue?: string;
  total?: number;
  tax?: number;
  status?: string;
  [key: string]: unknown;
}

export interface HaloAppointment {
  id: number;
  subject?: string;
  start_date?: string;
  end_date?: string;
  agent_id?: number;
  ticket_id?: number;
  client_id?: number;
  [key: string]: unknown;
}

export interface HaloKBArticle {
  id: number;
  title?: string;
  type?: number;
  inactive?: boolean;
  [key: string]: unknown;
}

export interface HaloSupplier {
  id: number;
  name: string;
  phone_number?: string;
  email?: string;
  website?: string;
  [key: string]: unknown;
}

export interface HaloQuotation {
  id: number;
  client_id?: number;
  client_name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface HaloOpportunity {
  id: number;
  summary?: string;
  client_id?: number;
  client_name?: string;
  value?: number;
  [key: string]: unknown;
}

export interface HaloTeam {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface HaloStatus {
  id: number;
  name: string;
  [key: string]: unknown;
}
