import { POLICY_CATALOG, SKILL_CATALOG } from "./catalog";
import { estimateTokens } from "./token";

export const SEED_MEMORIES = [
  {
    title: "Handoff: Archivist → Smith",
    tags: "handoff, agents",
    body: "Smith should generate the android USB udev skill from the hardening protocol. Do not include Magisk. Budget 700 tokens out. Compact this after the script is reviewed.",
  },
  {
    title: "Token budget Q3",
    tags: "tokens, policy",
    body: "Hard cap 2 000 prompt tokens per generation. Daily compact at 08:00. The last three generations overran because the full skill library was pasted in. Drop unused protocols.",
  },
  {
    title: "Fleet: Pixel 8 + work profile",
    tags: "android, security",
    body: "Device encrypted. USB charging-only except this Linux host. Developer options off between sessions. Accessibility review last Tuesday: only the system services. Next: udev rule for this serial.",
  },
  {
    title: "Connector stance",
    tags: "connectors, governance",
    body: "Drive is read-only for briefs. Gmail may file the daily report into a label, never auto-send. Teams alerts only for flagged mistakes ≥ 3. Calendar blocks for compact are 25 minutes.",
  },
  {
    title: "Repeated loop: skip compact",
    tags: "tutor, workflow",
    body: "Operator skipped /compact four times before long generations. Tutor: compact first, then pre-plan. Related skill: precision-token-engineering.",
  },
];

export const SEED_MISTAKES = [
  {
    pattern: "skipping compact before long generation",
    count: 5,
    flagged: true,
    tutor_note:
      "You skipped /compact five times before a long generation. Compact memory, then include at most three skills.",
  },
  {
    pattern: "installing skill without governance review",
    count: 3,
    flagged: true,
    tutor_note:
      "Three installs landed without a Governor skim. Open Oversight, confirm policies, then install.",
  },
  {
    pattern: "running generated linux as root",
    count: 4,
    flagged: true,
    tutor_note:
      "Generated scripts default to $HOME/.local. Do not sudo unless a human gate passed.",
  },
  {
    pattern: "connector sync without redaction",
    count: 2,
    flagged: false,
    tutor_note: "One more time and this flags. Redact before any export.",
  },
];

export const seedMistakes = SEED_MISTAKES;

export function seedSkills() {
  return SKILL_CATALOG.map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    summary: s.summary,
    protocol: s.protocol,
    linux_script: null as string | null,
    installed: s.defaultInstalled,
    token_cost: s.tokenCost,
    origin: "catalog",
  }));
}

export function seedPolicies() {
  return POLICY_CATALOG;
}

export function seedMemories() {
  return SEED_MEMORIES.map((m) => ({
    ...m,
    token_estimate: estimateTokens(m.body),
  }));
}

export function isoDaysAgo(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}
