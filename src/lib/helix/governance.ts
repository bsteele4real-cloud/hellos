export const TOKEN_BUDGET = 2000;
export const MAX_SKILLS_IN_PROMPT = 3;
export const MAX_SKILLS_HARD = 12;

export type PolicyFlag = {
  slug: string;
  enabled: boolean;
};

/**
 * A missing row follows the catalog default (every policy ships enabled).
 * Disabling a row is the only way to turn a rule off.
 */
export function isPolicyEnabled(policies: PolicyFlag[], slug: string): boolean {
  const row = policies.find((p) => p.slug === slug);
  return row ? row.enabled : true;
}

export function withPolicyFlag<T extends PolicyFlag>(
  policies: T[],
  slug: string,
  enabled: boolean,
): T[] {
  return policies.map((p) => (p.slug === slug ? { ...p, enabled } : p));
}

const SECRET_PATTERNS: readonly RegExp[] = [
  /\b(?:api[_-]?key|secret|token|password|passwd|pwd)\b\s*[:=]\s*["']?[^\s"'`,;]{6,}/gi,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/\S+/gi,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}\b/g,
  /\b(?:sk|rk|pk|ghp|gho|github_pat|xai|xox[baprs]|AKIA|ASIA)[-_][A-Za-z0-9_-]{8,}\b/g,
];

export function redactSecrets(input: string): { text: string; hits: number } {
  let text = input;
  let hits = 0;
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    text = text.replace(pattern, () => {
      hits += 1;
      return "[redacted]";
    });
  }
  return { text, hits };
}

export function textForCompact(
  body: string,
  policies: PolicyFlag[],
): { text: string; hits: number } {
  if (!isPolicyEnabled(policies, "redact-before-compact")) return { text: body, hits: 0 };
  return redactSecrets(body);
}

export function buildCompactPrompt(
  title: string,
  body: string,
  policies: PolicyFlag[],
): { prompt: string; hits: number } {
  const safe = textForCompact(body, policies);
  return {
    hits: safe.hits,
    prompt: `Compact this operator memory. Keep titles, decisions, paths, names. Drop narration. Output the compacted note only.\n\nTitle: ${title}\n\n${safe.text}`,
  };
}

export function reviewGeneration(input: {
  skillCount: number;
  promptTokens: number;
  uninstalledSlugs: string[];
  policies: PolicyFlag[];
}): string | null {
  if (
    isPolicyEnabled(input.policies, "no-full-library-prompts") &&
    input.skillCount > MAX_SKILLS_IN_PROMPT
  ) {
    return `No full-library prompts is on. Include at most ${MAX_SKILLS_IN_PROMPT} skills (got ${input.skillCount}).`;
  }
  if (isPolicyEnabled(input.policies, "token-budget-2k") && input.promptTokens > TOKEN_BUDGET) {
    return `Pre-plan budget is ${TOKEN_BUDGET} tokens. This prompt is about ${input.promptTokens}. Shorten the brief or drop a skill.`;
  }
  if (isPolicyEnabled(input.policies, "agent-allowlist") && input.uninstalledSlugs.length > 0) {
    const name = input.uninstalledSlugs[0];
    return `Agent tool allowlist is on. Install ${name} before including it.`;
  }
  return null;
}

export function reviewCombo(skillCount: number, policies: PolicyFlag[]): string | null {
  if (skillCount < 2) return "Pick at least two skills.";
  if (isPolicyEnabled(policies, "no-full-library-prompts") && skillCount > MAX_SKILLS_IN_PROMPT) {
    return `No full-library prompts is on. A playbook can include at most ${MAX_SKILLS_IN_PROMPT} skills.`;
  }
  return null;
}

const DESTRUCTIVE_LINE: readonly RegExp[] = [
  /\brm\s+(?:-[^\s]*r[^\s]*|--recursive)\b/i,
  /\b(?:apt-get|apt|dnf|yum|pacman|zypper)\s+(?:install|remove|purge|erase)\b/i,
  /\b(?:ufw|firewall-cmd|iptables|nft)\b/i,
  /\b(?:useradd|userdel|usermod|groupadd|passwd)\b/i,
  /\bmkfs(?:\.[a-z0-9]+)?\b/i,
  /\bdd\s+if=/i,
  /\bcurl\b[^\n]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/i,
  /\bsudo\b/i,
  /\bchmod\s+777\b/i,
  /\b(?:shutdown|reboot|poweroff)\b/i,
];

export function scriptIsDestructive(script: string): boolean {
  const code = script
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("#");
    })
    .join("\n");
  return DESTRUCTIVE_LINE.some((re) => re.test(code));
}

export function destructiveGate(
  script: string,
  policies: PolicyFlag[],
  confirmed: boolean,
): "allow" | "confirm" {
  if (!isPolicyEnabled(policies, "human-gate-destructive")) return "allow";
  if (!scriptIsDestructive(script)) return "allow";
  return confirmed ? "allow" : "confirm";
}

export function resolveGeneratedSkill(input: { target: string; policies: PolicyFlag[] }): {
  installed: false;
  origin: "generated" | "proposal";
} {
  if (input.target === "loop" && isPolicyEnabled(input.policies, "improver-proposes-only")) {
    return { installed: false, origin: "proposal" };
  }
  return { installed: false, origin: "generated" };
}

export const READ_ONLY_CONNECTOR_TOOLS = new Set([
  "google_drive_search",
  "gmail_search_messages",
  "google_calendar_list_events",
  "outlook_list_messages",
  "outlook_calendar_list_events",
  "microsoft_teams_list_chats",
]);

export function connectorToolAllowed(tool: string, policies: PolicyFlag[]): string | null {
  if (!isPolicyEnabled(policies, "connector-least-privilege")) return null;
  if (READ_ONLY_CONNECTOR_TOOLS.has(tool)) return null;
  return `Connector least privilege is on. ${tool} is not a read-only probe.`;
}
