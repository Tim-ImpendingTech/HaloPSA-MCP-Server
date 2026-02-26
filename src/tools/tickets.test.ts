import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTicketTools } from "./tickets.js";
import type { HaloApiClient } from "../client/halo-api-client.js";

function createMockClient(overrides: Record<string, unknown> = {}) {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as HaloApiClient;
}

/**
 * Registers the ticket tools and extracts a specific tool's handler
 * by capturing the callback passed to server.registerTool.
 */
function extractToolHandler(toolName: string, mockClient: HaloApiClient) {
  const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {};

  const server = {
    registerTool: vi.fn(
      (
        name: string,
        _opts: unknown,
        handler: (args: Record<string, unknown>) => Promise<unknown>
      ) => {
        handlers[name] = handler;
      }
    ),
  } as unknown as McpServer;

  registerTicketTools(server, mockClient);

  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(
      `Tool "${toolName}" not found. Registered: ${Object.keys(handlers).join(", ")}`
    );
  }
  return handler;
}

describe("halo_get_my_tickets", () => {
  const mockAgent = {
    id: 42,
    name: "Tim Test",
    email: "tim@example.com",
    team: "Support",
  };

  const mockTickets = {
    record_count: 2,
    records: [
      {
        id: 1001,
        summary: "Server is down",
        client_name: "Acme Corp",
        status: "Open",
        priority: "High",
        dateoccurred: "2026-02-25T10:00:00Z",
        deadlinedate: "2026-02-27T17:00:00Z",
        team: "Support",
      },
      {
        id: 1002,
        summary: "Email not working",
        client_name: "Globex Inc",
        status: "In Progress",
        priority: "Medium",
        dateoccurred: "2026-02-24T14:30:00Z",
        deadlinedate: null,
        team: "Support",
      },
    ],
  };

  let mockClient: HaloApiClient;
  let handler: (args: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    mockClient = createMockClient();
    (mockClient.get as ReturnType<typeof vi.fn>)
      .mockImplementation((path: string) => {
        if (path === "/Agent/me") return Promise.resolve(mockAgent);
        if (path === "/Tickets") return Promise.resolve(mockTickets);
        return Promise.reject(new Error(`Unexpected path: ${path}`));
      });
    handler = extractToolHandler("halo_get_my_tickets", mockClient);
  });

  it("calls /Agent/me then /Tickets with the agent's id", async () => {
    await handler({});

    const getCalls = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls;
    expect(getCalls[0][0]).toBe("/Agent/me");
    expect(getCalls[1][0]).toBe("/Tickets");
    expect(getCalls[1][1]).toMatchObject({ agent_id: 42 });
  });

  it("defaults to open_only=true", async () => {
    await handler({});

    const ticketCallParams = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls[1][1];
    expect(ticketCallParams.open_only).toBe(true);
  });

  it("respects open_only=false when provided", async () => {
    await handler({ open_only: false });

    const ticketCallParams = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls[1][1];
    expect(ticketCallParams.open_only).toBe(false);
  });

  it("applies pagination defaults", async () => {
    await handler({});

    const ticketCallParams = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls[1][1];
    expect(ticketCallParams.page_size).toBe(50);
    expect(ticketCallParams.page_no).toBe(1);
    expect(ticketCallParams.order).toBe("dateoccurred");
    expect(ticketCallParams.orderdesc).toBe(true);
  });

  it("passes custom pagination parameters through", async () => {
    await handler({ page_size: 10, page_no: 3, order: "priority", orderdesc: false });

    const ticketCallParams = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls[1][1];
    expect(ticketCallParams.page_size).toBe(10);
    expect(ticketCallParams.page_no).toBe(3);
    expect(ticketCallParams.order).toBe("priority");
    expect(ticketCallParams.orderdesc).toBe(false);
  });

  it("returns agent info and formatted ticket list", async () => {
    const result = await handler({}) as { content: { type: string; text: string }[] };

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agent).toEqual({
      id: 42,
      name: "Tim Test",
      email: "tim@example.com",
    });
    expect(parsed.record_count).toBe(2);
    expect(parsed.tickets).toHaveLength(2);
    expect(parsed.tickets[0]).toEqual({
      id: 1001,
      summary: "Server is down",
      client_name: "Acme Corp",
      status: "Open",
      priority: "High",
      dateoccurred: "2026-02-25T10:00:00Z",
      deadlinedate: "2026-02-27T17:00:00Z",
      team: "Support",
    });
  });

  it("returns an error result when /Agent/me fails", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("Authentication failed"));

    const result = await handler({}) as { content: { type: string; text: string }[]; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Authentication failed");
  });

  it("returns an error result when /Tickets fails", async () => {
    (mockClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(mockAgent)
      .mockRejectedValueOnce(new Error("API timeout"));

    const result = await handler({}) as { content: { type: string; text: string }[]; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API timeout");
  });

  it("passes search term through to the API", async () => {
    await handler({ search: "urgent" });

    const ticketCallParams = (mockClient.get as ReturnType<typeof vi.fn>).mock.calls[1][1];
    expect(ticketCallParams.search).toBe("urgent");
  });
});
