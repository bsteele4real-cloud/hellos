/** Local token estimator used for pre-planning. ~4 chars / token, word-aware floor. */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const byChars = Math.round(trimmed.length / 4);
  const byWords = Math.round(trimmed.split(/\s+/).length * 1.3);
  return Math.max(1, Math.round((byChars + byWords) / 2));
}

export function compactBudget(tokens: number): { kept: number; saved: number } {
  const kept = Math.max(32, Math.round(tokens * 0.28));
  return { kept, saved: Math.max(0, tokens - kept) };
}

export function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

/** Fixed overhead the Studio pre-plan adds for the generation instruction. */
export const PROMPT_OVERHEAD_TOKENS = 180;

export function estimatePromptTokens(input: {
  skillTokenCosts: number[];
  name: string;
  brief: string;
}): number {
  const protocolTokens = input.skillTokenCosts.reduce((sum, n) => sum + n, 0);
  return protocolTokens + estimateTokens(`${input.name} ${input.brief}`) + PROMPT_OVERHEAD_TOKENS;
}

/** Badge and inline counts include the unit so "640" is not ambiguous. */
export function formatTokenLabel(n: number): string {
  const count = formatTokens(n);
  return `${count} ${Math.abs(n) === 1 ? "token" : "tokens"}`;
}
