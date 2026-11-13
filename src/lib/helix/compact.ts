import { textForCompact, type PolicyFlag } from "./governance.ts";

export function localCompact(body: string): string {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const keep = lines.filter((line, index) => index === 0 || /^(#|-|\d+\.)/.test(line) || line.length < 140);
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

export function undoNote(previousBody: string | null | undefined): string | null {
  if (!previousBody) return null;
  return previousBody;
}
