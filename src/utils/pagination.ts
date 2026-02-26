import { z } from "zod";

export const paginationSchema = {
  page_size: z
    .number()
    .optional()
    .describe("Number of records per page (default 50)"),
  page_no: z.number().optional().describe("Page number (default 1)"),
  order: z.string().optional().describe("Field name to sort by ascending"),
  orderdesc: z
    .boolean()
    .optional()
    .describe("Sort descending instead of ascending"),
  search: z
    .string()
    .optional()
    .describe("Search term to filter results"),
};

export function buildQueryParams(
  params: Record<string, unknown>
): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return query;
}
