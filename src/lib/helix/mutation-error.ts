const GENERIC = "Something went wrong. Try again.";

function readMessage(value: unknown, seen: Set<unknown>): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  const record = value as { message?: unknown; cause?: unknown };
  const own = typeof record.message === "string" ? record.message.trim() : "";
  const cause = readMessage(record.cause, seen);
  if (own && cause && /^server\b/i.test(own)) return cause;
  return own || cause;
}

export function mutationErrorMessage(error: unknown): string {
  return readMessage(error, new Set()) ?? GENERIC;
}
