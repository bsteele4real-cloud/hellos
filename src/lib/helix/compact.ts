import { textForCompact, type PolicyFlag } from "./governance.ts";

export function localCompact(body: string): string {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const keep = lines.filter(
    (line, index) => index === 0 || /^(#|-|\d+\.)/.test(line) || line.length < 140,
  );
  const text = (keep.length ? keep : lines.slice(0, 4)).join("\n");
  return text.slice(0, 900);
}

/** Shortened text plus the exact body to restore if the user undoes. */
export function compactNote(
  body: string,
  policies: PolicyFlag[],
): { next: string; previous: string } {
  return {
    next: localCompact(textForCompact(body, policies).text),
    previous: body,
  };
}

export function savingsFromCompact(beforeTokens: number, afterTokens: number): number {
  return Math.max(0, beforeTokens - afterTokens);
}

export function tokensSavedAfterUndo(reportSaved: number, noteSaved: number): number {
  return Math.max(0, reportSaved - Math.max(0, noteSaved));
}

export function reportDay(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

export function undoNote(previousBody: string | null | undefined): string | null {
  if (!previousBody) return null;
  return previousBody;
}
