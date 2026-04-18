# HaloPSA MCP Server Improvements - Design Spec

**Date**: 2026-03-27
**Author**: Nick Vasilopoulos (Attuned IT)
**Repository**: TheBigPieceOfChicken/HaloPSA-MCP-Server (fork of Tim-ImpendingTech)

---

## Problem

The current MCP server has 35 tools but critical gaps:
- `list_statuses` and `list_ticket_types` return empty results
- `get_ticket` returns 146KB+ JSON (exceeds token limits)
- No delete operations (client has `delete()` method but no tools use it)
- No time tracking or billing tools (core MSP workflow)

## Phase 1: Fix What's Broken

### 1a. Fix `list_statuses`
- Investigate HaloPSA `/Status` endpoint -- may need `lookup_id` or different params
- Fallback: try `/Tickets?count_only=true&statuses=true` or similar
- Must return: `{ id, name }` for each status

### 1b. Fix `list_ticket_types`
- Investigate `/TicketType` endpoint params
- May need `showall=true` or similar flag
- Must return: `{ id, name }` for each type

### 1c. Trim `get_ticket` response
- Current: returns entire ticket object (146KB+)
- Fix: return curated fields matching what's useful:
  - id, summary, details (truncated to 2000 chars), status, priority
  - client_name, user_name, agent_name, team
  - dateoccurred, dateclosed, deadlinedate
  - category_1/2/3, sla_id
  - Custom fields array
- Add `include_full_details` boolean param (default false) for when full response is needed

## Phase 2: Delete Operations

### 2a. `halo_delete_ticket`
- DELETE `/Tickets/{id}`
- Requires `ticket_id` (number) and `confirm` (boolean, must be true)
- Returns success message with deleted ticket ID

### 2b. `halo_delete_action`
- DELETE `/Actions/{id}`
- Requires `action_id` (number) and `confirm` (boolean)
- Returns success message

## Phase 3: Time & Billing

### 3a. `halo_list_time_entries`
- GET `/Timesheet` with filters:
  - `ticket_id` (optional) -- entries for specific ticket
  - `agent_id` (optional) -- entries by specific agent
  - `client_id` (optional) -- entries for specific client
  - `start_date`, `end_date` (optional) -- date range filter
  - Standard pagination
- Returns: id, ticket_id, agent_name, duration, notes, billable, date

### 3b. `halo_create_time_entry`
- POST `/Timesheet`
- Required: `ticket_id`, `duration_minutes`, `notes`
- Optional: `agent_id`, `billable` (default true), `date` (ISO 8601, default now)
- Returns created entry

### 3c. `halo_update_time_entry`
- POST `/Timesheet` with `id` field
- Same fields as create, all optional except `id`
- Returns updated entry

### 3d. `halo_delete_time_entry`
- DELETE `/Timesheet/{id}`
- Requires `id` and `confirm` boolean
- Returns success message

### 3e. `halo_get_billable_summary`
- GET `/Timesheet` with aggregation
- Required: `client_id` or `agent_id`
- Optional: `start_date`, `end_date`
- Returns: total_hours, billable_hours, non_billable_hours, entries_count

## Phase 4: Invoice Improvements

### 4a. Enhance `halo_list_invoices` (exists, read-only)
- Add filters: `client_id`, `status`, `date_from`, `date_to`
- Trim response to key fields

### 4b. `halo_get_invoice_details`
- GET `/Invoice/{id}`
- Returns: invoice header + line items (trimmed)

### 4c. `halo_create_invoice`
- POST `/Invoice`
- Required: `client_id`
- Optional: `ticket_ids[]`, `date_from`, `date_to`, `notes`
- Creates invoice from unbilled time entries

## Patterns

All new tools follow existing conventions:
- Use `zod` for input validation
- Use `errorResult()` for error handling
- Use `paginationSchema` for list endpoints
- Wrap POST bodies in arrays (HaloPSA convention, handled by client)
- Delete operations require `confirm: true` safety check
- Trim responses to useful fields (don't dump raw API response)

## Out of Scope
- Reporting/analytics (separate future project)
- Workflow/automation editing (too risky via API)
- Standalone timesheets (ticket-based covers 90% of use)
