import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HaloApiClient } from "../client/halo-api-client.js";
import type { HaloKBArticle, HaloListResponse } from "../client/types.js";
import { paginationSchema } from "../utils/pagination.js";
import { errorResult } from "../utils/errors.js";

export function registerKnowledgeBaseTools(
  server: McpServer,
  client: HaloApiClient
): void {
  server.registerTool("halo_search_kb_articles", {
    title: "Search KB Articles",
    description:
      "Search HaloPSA knowledge base articles by keyword. Returns matching articles.",
    inputSchema: {
      ...paginationSchema,
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloListResponse<HaloKBArticle>>(
        "/KBArticle",
        {
          page_size: args.page_size ?? 50,
          page_no: args.page_no ?? 1,
          order: args.order,
          orderdesc: args.orderdesc,
          search: args.search,
        }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: result.record_count,
                articles: result.records.map((a) => ({
                  id: a.id,
                  title: a.title,
                  type: a.type,
                  inactive: a.inactive,
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

  server.registerTool("halo_get_kb_article", {
    title: "Get KB Article",
    description:
      "Get a single HaloPSA knowledge base article by ID with full content.",
    inputSchema: {
      article_id: z.number().describe("The KB article ID to retrieve"),
    },
  }, async (args) => {
    try {
      const result = await client.get<HaloKBArticle>(
        `/KBArticle/${args.article_id}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  });

  server.registerTool("halo_create_kb_article", {
    title: "Create KB Article",
    description:
      "Create a new HaloPSA knowledge base article.",
    inputSchema: {
      title: z.string().describe("Article title"),
      type: z.number().optional().describe("Article type ID"),
    },
  }, async (args) => {
    try {
      const result = await client.post<HaloKBArticle>("/KBArticle", args);
      return {
        content: [
          {
            type: "text",
            text: `KB article created successfully:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  });
}
