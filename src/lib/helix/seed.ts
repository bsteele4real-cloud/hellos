import { POLICY_CATALOG, SKILL_CATALOG } from "./catalog.ts";

export type InitEvent = {
  kind: "init";
  label: string;
  detail: string;
  severity: "info";
};

/** The only event /init writes. History stays empty until the user acts. */
export const INIT_EVENT: InitEvent = {
  kind: "init",
  label: "Workspace initialized",
  detail: "Skill library loaded. No past activity was added.",
  severity: "info",
};

export function initialHistory() {
  return {
    memories: [] as const,
    mistakes: [] as const,
    reports: [] as const,
    backdatedEvents: [] as const,
    event: INIT_EVENT,
  };
}

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
