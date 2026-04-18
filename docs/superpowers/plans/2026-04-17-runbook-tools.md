# Runbook Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four MCP tools (`halo_list_runbooks`, `halo_get_runbook`, `halo_create_runbook`, `halo_delete_runbook`) to halopsa-mcp-server for managing HaloPSA Integration Runbooks ("Webhooks" in Halo's API).

**Architecture:** One new domain file `src/tools/runbooks.ts` exporting `registerRunbookTools(server, client)`, wired into `src/tools/index.ts`. Uses the existing `HaloApiClient` (get/getList/post/delete) and `errorResult()` helper. No new modules, no schema types beyond `Record<string, unknown>` — the create tool is a raw-JSON passthrough.

**Tech Stack:** TypeScript, Node, MCP SDK (`@modelcontextprotocol/sdk`), Zod for input schemas. Existing OAuth2 client-credentials flow in `HaloApiClient`.

**Reference:** Design spec at [docs/superpowers/specs/2026-04-17-runbook-tools-design.md](../specs/2026-04-17-runbook-tools-design.md).

**Testing note:** Per the approved spec, the repo has zero tests and this feature ships without them to match the existing pattern. Verification is via TypeScript compilation (`npm run build`) and a manual smoke test (Task 7). Codex reviews the diff before merge per the Claude+Codex collaboration norm.

---

## File Structure

- **Create:** `src/tools/runbooks.ts` — all four runbook tools (~120 lines)
- **Modify:** `src/tools/index.ts` — add import + one line in `registerAllTools`

That is the entire change surface.

---

## Task 1: Scaffold `runbooks.ts` with empty register function

**Files:**
- Create: `src/tools/runbooks.ts`

- [ ] **Step 1: Create the file with header, imports, and empty function**

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import { errorResult } from "../utils/errors.js";

export function registerRunbookTools(
  server: McpServer,
  client: HaloApiClient
): void {
  // Tools added in subsequent tasks.
  void server;
  void client;
}
```

The `void server; void client;` lines silence unused-parameter warnings in strict TypeScript until the tools are added. They're removed in Task 3 when the first tool is written.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile, no errors. A new `dist/tools/runbooks.js` appears.

- [ ] **Step 3: Commit**

```bash
git add src/tools/runbooks.ts
git commit -m "feat(runbooks): scaffold runbooks tool domain file"
```

---

## Task 2: Wire `registerRunbookTools` into `index.ts`

**Files:**
- Modify: `src/tools/index.ts`

- [ ] **Step 1: Add the import**

Add this line after line 24 (`import { registerServiceTools } from "./services.js";`):

```typescript
import { registerRunbookTools } from "./runbooks.js";
```

- [ ] **Step 2: Add the registration call**

Append this to the end of `registerAllTools` (after line 66, before the closing brace):

```typescript

  // Phase - Integration Runbooks
  registerRunbookTools(server, client);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 4: Commit**

```bash
git add src/tools/index.ts
git commit -m "feat(runbooks): wire runbook tools into tool registry"
```

---

## Task 3: Implement `halo_list_runbooks`

**Files:**
- Modify: `src/tools/runbooks.ts`

- [ ] **Step 1: Replace the function body**

Replace the entire `registerRunbookTools` function body (including the `void server; void client;` lines) with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 3: Commit**

```bash
git add src/tools/runbooks.ts
git commit -m "feat(runbooks): add halo_list_runbooks tool"
```

---

## Task 4: Implement `halo_get_runbook`

**Files:**
- Modify: `src/tools/runbooks.ts`

- [ ] **Step 1: Append the second tool inside `registerRunbookTools`**

Add immediately after the closing `});` of `halo_list_runbooks` (still inside the function):

```typescript

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 3: Commit**

```bash
git add src/tools/runbooks.ts
git commit -m "feat(runbooks): add halo_get_runbook tool"
```

---

## Task 5: Implement `halo_create_runbook`

**Files:**
- Modify: `src/tools/runbooks.ts`

- [ ] **Step 1: Append the create tool inside `registerRunbookTools`**

Add immediately after the closing `});` of `halo_get_runbook`:

```typescript

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 3: Commit**

```bash
git add src/tools/runbooks.ts
git commit -m "feat(runbooks): add halo_create_runbook tool"
```

---

## Task 6: Implement `halo_delete_runbook`

**Files:**
- Modify: `src/tools/runbooks.ts`

- [ ] **Step 1: Append the delete tool inside `registerRunbookTools`**

Add immediately after the closing `});` of `halo_create_runbook`:

```typescript

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: clean compile.

- [ ] **Step 3: Commit**

```bash
git add src/tools/runbooks.ts
git commit -m "feat(runbooks): add halo_delete_runbook tool"
```

---

## Task 7: Final verification and smoke test

**Files:** none modified — this task validates the full feature.

- [ ] **Step 1: Clean rebuild**

Run: `rm -rf dist && npm run build`
Expected: clean compile, `dist/tools/runbooks.js` exists, no TypeScript errors.

- [ ] **Step 2: Restart the MCP server so Claude Code picks up the new tools**

Nick: restart Claude Code (`/exit` then relaunch) OR run `claude mcp restart halopsa` if supported. The `halopsa` MCP points at `dist/index.js`, so the rebuild must happen first.

- [ ] **Step 3: Smoke test via the MCP tools**

In a Claude Code session with the `halopsa` MCP connected:

1. Call `halo_list_runbooks` with no args → expect JSON array including existing runbooks ("AI Insights", "JumpCloud Import", etc.).
2. Call `halo_get_runbook` with an id from step 1 (e.g. "AI Insights") → expect full JSON with `variables`, `steps`, etc. **Save this output as the template for step 3.**
3. Call `halo_create_runbook` with a minimal test payload:

```json
{
  "name": "SMOKE TEST - delete me",
  "enabled": false
}
```

Expect: created runbook JSON with a new `id`.

4. Call `halo_delete_runbook` with that id and `confirm: true` → expect success message.
5. Call `halo_list_runbooks` again → confirm the smoke-test runbook is gone.

If any step fails with an HTTP error, paste the error body — that's Halo's validation message and tells us exactly what the real payload shape needs.

- [ ] **Step 4: Hand off to Codex for review**

Per Nick's Claude+Codex collaboration norm, Codex reviews the diff on `feat/runbook-tools` before merge. Claude does not merge to main.

- [ ] **Step 5: Final commit (if any cleanup)**

If the smoke test surfaced issues and any fix commits were made, the branch is ready for review as-is. No extra commit needed if everything passed.

---

## Self-Review Checklist (done during plan authoring, not at execution time)

- [x] **Spec coverage:** All four tools from the spec's "Tool Specifications" section map to Tasks 3–6. Delete safety (confirm flag) in Task 6. Pagination convention (`page_size`/`page_no`) in Task 3. Raw-JSON passthrough for create in Task 5.
- [x] **Placeholder scan:** No TBD/TODO/"handle edge cases". All code is complete.
- [x] **Type consistency:** `Record<string, unknown>` used consistently for all four response types. `registerRunbookTools(server, client)` signature identical in Tasks 1 and 2.
- [x] **No orphan references:** `errorResult` imported in Task 1, used in Tasks 3–6. `client.getList`, `client.get`, `client.post`, `client.delete` all exist per the explore report.
