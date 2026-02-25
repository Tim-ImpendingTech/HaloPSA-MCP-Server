export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function errorResult(error: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${formatError(error)}` }],
    isError: true,
  };
}
