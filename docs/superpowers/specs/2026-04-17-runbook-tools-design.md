# Runbook Tools — Design

**Status:** Approved
**Date:** 2026-04-17
**Author:** Nick Vasilopoulos (with Claude Code)
**Scope:** Add minimal CRUD tools for HaloPSA Integration Runbooks ("Webhooks" in Halo's internal API) to the halopsa-mcp-server.

## Motivation

Halo's Integration Runbooks are a candidate for automation — creating them via the admin UI is brittle, especially through browser automation (nested modals, dropdowns in portals, bubbling Escape that discards drafts). The REST API at `POST /api/Webhook` is the correct path. Neither of the two MCP servers Nick currently uses (`halopsa` fork, `halopsa-remote` official) exposes this endpoint. This spec adds that coverage.

The immediate motivating task is a runbook called "Post Service Status Update" that accepts `service_id`, `status_code`, `status_html` and calls an existing Integration Method. This feature unblocks that work and anything similar.

## Scope

**In scope (Option A — minimal, raw-JSON passthrough):**

- `halo_list_runbooks` — list existing runbooks
- `halo_get_runbook` — fetch one runbook's full JSON (used for payload discovery and verification)
- `halo_create_runbook` — create a runbook from a caller-supplied JSON payload
- `halo_delete_runbook` — delete a runbook by id

**Explicitly out of scope:**

- Typed parameters for variables, steps, events, conditions — the caller owns the JSON shape
- `halo_update_runbook` (PUT/PATCH) — deferred; in this iteration an edit is a delete + create
- Step-type abstractions (Execute Method, Conditional, Loop, etc.)
- Object Mapping Profile helpers
- Delivery / log inspection
- Any schema validation beyond "object passthrough"

The design philosophy: Halo owns the runbook schema. We forward JSON as-is. The LLM or the caller is responsible for constructing a valid payload, using `halo_get_runbook` on an existing runbook as the reference template.

## Architecture

Single new file: `src/tools/runbooks.ts` exporting `registerRunbookTools(server, client)`. One-line import added to `src/tools/index.ts` to register alongside existing domains. No changes to the API client, config, or auth.

The existing `HaloApiClient` already provides `get`, `getList`, `post`, `delete` with Bearer-token auth, error handling, and Halo's array-wrapping convention on POST bodies. All four tools use these existing methods; no new transport code is needed.

## Tool Specifications

> **Endpoint asymmetry discovered during implementation (2026-04-17):** Halo's API splits read and write for runbooks across two endpoints, and Services-auth API apps (client-credentials flow) have restricted read visibility. Read tools use `/WebhookRepository` and only see shipped library templates; tenant-customized runbooks are invisible to this auth type. Write tools use `/Webhook` and work for all runbooks. See the Risks section below.

### `halo_list_runbooks`

- **HTTP:** `GET /WebhookRepository` (client prepends `/api/`)
- **Input (Zod):**
  - `search?: string` — substring match on runbook name
- **Output:** JSON-stringified array of runbook summaries from Halo's shared repository (library templates).
- **Limitation:** returns only runbooks visible to Services-auth API apps — typically only shipped Halo library templates (Azure OpenAI, OpenAI Suggestions, etc.), not tenant-customized runbooks. Pagination params removed because the underlying endpoint returns a small bare array.

### `halo_get_runbook`

- **HTTP:** `GET /WebhookRepository/{id}`
- **Input (Zod):**
  - `id: string` — runbook UUID (Halo uses UUIDs for these)
- **Output:** JSON-stringified full runbook object including `steps`, configuration fields, etc.
- **Primary use:** payload discovery. Callers read a library template (e.g. "Azure OpenAI Suggestions") to learn the JSON shape Halo expects before constructing their own `halo_create_runbook` payload.
- **Limitation:** will 404 on runbooks created in your own tenant, since they aren't exposed to Services-auth reads.

### `halo_create_runbook`

- **HTTP:** `POST /Webhook` with the body array-wrapped by the client.
- **Input (Zod):**
  - `runbook: z.object({}).passthrough()` — the complete runbook object, any fields. Required top-level fields per Halo (`name`, etc.) are the caller's responsibility; validation is server-side by Halo, with 400 errors surfaced verbatim.
- **Output:** JSON-stringified created runbook (includes the assigned `id`).
- **Tool description guidance (baked into the tool's description string):** Tell the LLM to call `halo_get_runbook` first on a similar existing runbook to learn the shape, then mirror that structure.

### `halo_delete_runbook`

- **HTTP:** `DELETE /Webhook/{id}`
- **Input (Zod):**
  - `id: string`
  - `confirm: boolean` — must be `true` to proceed, else the tool returns a guard message and does nothing
- **Output:** short confirmation message (`"Runbook {id} deleted successfully."`).
- **Safety:** the `confirm: true` guard matches the repo's existing destructive-tool pattern (`halo_delete_ticket`, `halo_delete_action`, `halo_delete_time_entry` all require it). This tool lives in `src/tools/runbooks.ts` (not the shared `delete.ts`) following the `timesheets.ts` precedent for domain-local deletes.

## Data Flow

```
MCP caller → Zod validate input → client.{get,post,delete}(path, body) →
Halo REST API → response → JSON.stringify → MCP text content block
```

Errors at any stage (Zod validation, HTTP 4xx/5xx, network) are caught by the tool's outer try/catch and routed to `errorResult()` from `src/utils/errors.ts`, matching every other tool in the repo.

## Error Handling

Rely entirely on existing infrastructure:

- `HaloApiClient` surfaces HTTP errors with Halo's response body attached. A 400 on create typically contains Halo's validation message (e.g. "name is required") and the caller sees it.
- `errorResult()` wraps thrown errors into the MCP error content format.

No new error types. No retries. No special-casing.

## Testing

The repo currently has **zero tests**. Adding a test framework (vitest or jest) for this feature alone is out of proportion to the change and amounts to a separate "introduce testing" initiative that should be scoped on its own.

**Decision:** Ship without tests, matching the existing repo pattern. Verification is:

1. Code review by Codex after Claude's implementation commit (per Nick's Claude+Codex collaboration norm).
2. Manual smoke test: list runbooks, get one existing runbook, create the "Post Service Status Update" runbook, verify in Halo UI, delete it, re-create as final.

Bootstrapping a test framework for the repo is tracked as a separate future task.

## Git Workflow

- Branch: `feat/runbook-tools` off `main` (created).
- Commits:
  1. This spec document.
  2. Implementation (`src/tools/runbooks.ts` + `src/tools/index.ts` wiring).
- Review: Codex reviews on the same branch before merge. Per Nick's norm, Claude is builder, Codex is reviewer.
- Merge: fast-forward to `main` after Codex approves.

## Risks and Open Questions

1. **Endpoint split and read-visibility limitation (confirmed).** Halo serves runbook reads from `/WebhookRepository` and writes at `/Webhook`. Services-auth API apps can only *read* shipped library templates from `/WebhookRepository`; tenant-customized runbooks (the ones you create in the admin UI) are invisible via these endpoints. Writes to `/Webhook` succeed for all runbooks. An integration-test confirmed a create/delete round-trip works and returns the expected UUID; a GET by that same UUID immediately after creation returns 404. Workaround: after creating a runbook through these tools, verify in the Halo admin UI rather than through `halo_get_runbook`. To regain full read visibility, the API app would need to be re-registered with "Username & Password" auth type (full agent session) rather than "Client ID and Secret (Services)", which is out of scope here.

2. **OAuth permissions (confirmed).** The MCP-Server-Dev app needs `all:standard` and `admin:webhooks` permissions granted. Scope is set via the `HALOPSA_SCOPE` env var in `.mcp.json`. Without `admin:webhooks`, `/Webhook` returns 401.

3. **Array-wrap on POST.** Halo convention: POST bodies are array-wrapped. The existing `client.post()` already does this. The caller passes a single object; the client wraps. Confirmed working.

4. **Pagination convention:** `/WebhookRepository` returns a bare array without pagination — `page_size`/`page_no` params removed from `halo_list_runbooks` since they are ignored by this endpoint.
