export type SkillCategory =
  | "memory"
  | "governance"
  | "security"
  | "build"
  | "agents"
  | "workflow"
  | "tokens"
  | "codegen";

export type CatalogSkill = {
  slug: string;
  name: string;
  category: SkillCategory;
  summary: string;
  protocol: string;
  linuxHint: string;
  tokenCost: number;
  defaultInstalled: boolean;
};

export type CatalogPolicy = {
  slug: string;
  name: string;
  domain: string;
  rule: string;
  enabled: boolean;
};

export const CATEGORY_LABEL: Record<SkillCategory, string> = {
  memory: "Memory",
  governance: "Governance",
  security: "Security",
  build: "Build",
  agents: "Agents",
  workflow: "Workflow",
  tokens: "Tokens",
  codegen: "Codegen",
};

export const SKILL_CATALOG: CatalogSkill[] = [
  {
    slug: "agent-secure-memory",
    name: "Agent Secure Memory",
    category: "memory",
    summary:
      "Shared second-brain store with redaction, TTL, and scoped recall so agents never leak secrets into long context.",
    defaultInstalled: true,
    tokenCost: 640,
    linuxHint: "Encrypt at rest with age, rotate keys, scrub journald.",
    protocol: `# Agent Secure Memory

## Purpose
Give every agent a shared, scoped memory that is smaller than the raw log and safer than a paste dump.

## Store
- Write memories as short titled notes with tags, never as full transcripts.
- Estimate tokens on write. Refuse to keep a note over 800 tokens without compacting first.
- Mark secrets (keys, tokens, passwords, connection strings) and strip them before any compact or export.

## Recall
- Retrieve by tag + recency, not by dumping the whole brain.
- Default recall budget: 400 tokens. Raise only with an explicit operator override.
- Prefer compacted notes over raw notes when both exist.

## TTL
- Working memory: 7 days.
- Durable decisions: keep, but compact quarterly.
- Credentials: never persist. Point to a vault path instead.

## Oversight
- Every write is an event. Compacts are events with tokens saved.
- Operators can purge a tag from Command.`,
  },
  {
    slug: "agent-governance",
    name: "Agent Governance",
    category: "governance",
    summary:
      "Policy engine for agent actions: allowlists, human gates, and an audit trail for admin control.",
    defaultInstalled: true,
    tokenCost: 520,
    linuxHint: "Log policy decisions to a local audit file with chmod 600.",
    protocol: `# Agent Governance

## Purpose
No agent acts with more authority than the operator granted.

## Roles
- Operator: runs workflows, installs skills, records mistakes.
- Admin: toggles policies, approves destructive Linux, manages connectors.
- Agent: proposes; never self-approves a gated action.

## Gates
- Destructive filesystem, package, or firewall changes require a human confirm.
- Connector writes (mail send, file trash) require a human confirm.
- Read-only recall and token estimates do not.

## Audit
- Record kind, actor, policy slug, decision (allow/deny/defer), and a one-line reason.
- Flag repeated denials of the same action as a tutor pattern.

## Default deny
- If a policy is missing, deny and ask the operator to add one.`,
  },
  {
    slug: "android-hardening-protocol",
    name: "Android Hardening Protocol",
    category: "security",
    summary:
      "Device and host-side hardening: ADB lockdown, encryption, USB, and Linux companion scripts.",
    defaultInstalled: false,
    tokenCost: 780,
    linuxHint: "ADB + fastboot checklist, udev rules, no-root policy.",
    protocol: `# Android Hardening Protocol

## Purpose
Harden a personal Android device from a Linux host without rooting unless the operator explicitly opts in.

## Host (Linux)
- Install platform-tools from a known vendor; pin versions.
- udev: restrict adb to the operator plugdev group.
- Never leave \`adb tcpip\` enabled on untrusted networks.

## Device
1. Screen lock with strong credential; auto-lock ≤ 1 minute.
2. Encryption on; verify with settings dump.
3. USB: charging-only by default; authorize this computer only.
4. Developer options off when not in an active session.
5. Unknown sources off. Play Protect on.
6. Disable unused radios (NFC, Bluetooth) when traveling.
7. Review admin apps and accessibility services weekly.

## Session hygiene
- \`adb kill-server\` at the end of a session.
- Do not persist \`adb root\`.
- Capture a hardening report, compact it, store under tag \`android\`.

## Out of scope
- Exploit development, bypassing locks, or attacking others' devices.`,
  },
  {
    slug: "dashboard-builder",
    name: "Dashboard Builder",
    category: "build",
    summary:
      "Compose operator dashboards from workflow events, token spend, and tutor flags — one glance, no noise.",
    defaultInstalled: false,
    tokenCost: 410,
    linuxHint: "Optional: export a daily JSON snapshot for other tools.",
    protocol: `# Dashboard Builder

## Purpose
Show only what changes operator behavior.

## Panels (fixed set)
1. Productivity index (actions vs mistakes, 7-day).
2. Tokens spent vs saved (compact + pre-plan).
3. Flagged patterns (tutor).
4. Init / compact freshness.
5. Connector health.

## Rules
- Prefer 7-day windows over all-time vanity totals.
- Empty states explain the next command (\`/init\`, \`/compact\`, \`/log\`).
- Never auto-call an LLM to paint the dashboard. Generate a briefing only on request.

## Export
- Daily report is the portable artifact. Keep it under 200 tokens.`,
  },
  {
    slug: "multi-agent-systems",
    name: "Multi-Agent Systems",
    category: "agents",
    summary:
      "Role cards, handoff protocol, and a swarm that shares Helix memory instead of copying entire threads.",
    defaultInstalled: false,
    tokenCost: 690,
    linuxHint: "Process supervision via systemd user units, one agent per unit.",
    protocol: `# Multi-Agent Systems

## Purpose
Split work across named agents with tight interfaces so context does not fan out.

## Roster
- Archivist — memory write/recall.
- Governor — policy checks.
- Smith — skill and Linux generation.
- Tutor — mistake patterns and daily briefing.
- Runner — executes approved Linux on the host.

## Handoff
1. Sender writes a compacted brief (≤ 200 tokens) to memory with tag \`handoff\`.
2. Receiver reads only that brief plus the relevant skill protocol.
3. Result is written back; raw scratch is discarded.

## Parallelism
- Independent skills may run together.
- Shared files and connectors are single-writer.
- The Governor serializes gated actions.

## Failure
- If an agent repeats the same error twice, stop and flag a tutor pattern.
- Do not let the agent rewrite its own skill in the same run. Hand that to Agent Loop Improver.`,
  },
  {
    slug: "workflow-optimizer",
    name: "Workflow Optimizer",
    category: "workflow",
    summary:
      "Record /init, detect repeated mistakes, and tutor the operator with daily, specific corrections.",
    defaultInstalled: true,
    tokenCost: 480,
    linuxHint: "Cron-friendly: dump today's events, compact, mail the briefing.",
    protocol: `# Workflow Optimizer

## Purpose
Treat the operator's own loops as the product. Record work. Flag repeats. Teach.

## /init
- Bind this user as the workspace owner.
- Seed the skill library and default policies.
- Start event recording. Without init, analytics stay dark.

## Recording
- Actions: what was attempted and the outcome.
- Mistakes: a short pattern name, not a novel.
- Same pattern ≥ 3 times → flag and write a tutor note.

## Daily report
- Count actions, flags, tokens saved/spent.
- Name the one loop to break tomorrow.
- Do not moralize. Be specific.

## Tutor stance
When the operator is looping the same mistake, switch from executor to tutor: show the last three occurrences and the skill that would have prevented the fourth.`,
  },
  {
    slug: "precision-token-engineering",
    name: "Precision Token Engineering",
    category: "tokens",
    summary:
      "Pre-plan prompts, budget tokens, and /compact memory so generations stay small and deliberate.",
    defaultInstalled: true,
    tokenCost: 560,
    linuxHint: "Count bytes of skill files before shipping them into a prompt.",
    protocol: `# Precision Token Engineering

## Purpose
Spend tokens on the plan, not on the residue.

## Pre-plan (required before generation)
1. State the job in one sentence.
2. Name the skills to include (never the whole library).
3. Estimate tokens of the brief + selected protocols.
4. If over 2 000 tokens, compact or drop a skill.
5. Cap model output (\`max_tokens\`) to the size of the artifact, not a round 4k.

## /compact
- Compress uncompacted memory to ~28% of original tokens.
- Keep titles, decisions, and paths. Drop narration, apologies, and duplicates.
- Record tokens saved as an event.

## Anti-patterns
- Pasting full logs into a generation.
- Re-generating the same script without reading the last one.
- Loading every installed skill "just in case."
- Letting the task rewrite its own protocol. That is a later observer pass.`,
  },
  {
    slug: "skill-creator",
    name: "Skill Creator",
    category: "codegen",
    summary:
      "Author Helix skills and Linux scripts from a short brief, then install them into the library.",
    defaultInstalled: false,
    tokenCost: 720,
    linuxHint: "Emit bash that is shellcheck-clean, set -euo pipefail, no curl | sh.",
    protocol: `# Skill Creator

## Purpose
Turn a job description into a reusable skill: protocol markdown + optional Linux script.

## Skill shape
- \`slug\`, name, category, summary (≤ 160 chars).
- Protocol: purpose, steps, gates, out of scope.
- Linux script: optional, idempotent, no secrets inlined.

## Linux bar
- \`#!/usr/bin/env bash\` and \`set -euo pipefail\`.
- Check dependencies before using them.
- Write to \`\$HOME/.local\` unless the operator asked for system paths.
- Refuse \`curl | sh\`, wget-to-root, and disabling of security tools.

## Combine
- A combo playbook lists source slugs, then a merged procedure.
- Token cost of a combo is the sum of children minus overlap after compact.

## Install
- Generated skills start uninstalled. Operator installs after a skim.
- The Agent Loop Improver may propose a protocol edit. It does not install it.`,
  },
  {
    slug: "agent-loop-improver",
    name: "Agent Loop Improver",
    category: "agents",
    summary:
      "Observer skill: read repeated mistakes, propose one focused edit to a skill, and wait for a human to merge it.",
    defaultInstalled: false,
    tokenCost: 540,
    linuxHint: "Weekly user timer writes a proposal. It never applies the edit.",
    protocol: `# Agent Loop Improver

## Purpose
Make the next run better than the last one without rewriting a skill mid-task. The improver watches. The operator merges.

## Stance
- Observer, not participant. It does not run inside the job it is scoring.
- One skill, one edit, per cycle.
- A rejected proposal stays rejected. Do not refile the same diff.

## Capture
- After a run, record a short trace: skill slug, outcome, and the operator's correction.
- Keep the trace under 120 tokens. Drop transcripts, apologies, and secrets.
- A tutor flag (same mistake ≥ 3) is the trigger. No flag, no rewrite.

## Observe (scheduled, not per task)
1. Read flagged patterns and the traces tagged \`loop\`.
2. Name the skill whose protocol should have prevented the repeat.
3. Propose a single change: a missing step, a gate, or an anti-pattern.
4. Write the proposal as a diff against that protocol. Do not touch other skills.
5. Stop. The operator installs or edits. The next run inherits the merge.

## Refuse
- Editing governance, redaction, or the token budget from this skill.
- Raising the prompt budget to "fit more traces." Compact traces first.
- Improving the improver in the same cycle.
- Applying the edit from the Linux timer. The timer only writes the proposal file.

## Linux
Studio target \`loop\` installs a user systemd timer. It appends traces under \`~/.local/share/helix/loops\` and writes \`proposal.md\`. It does not patch the library.

## Out of scope
Retraining, silent self-edits, and scoring systems you do not operate.`,
  },
];

export const POLICY_CATALOG: CatalogPolicy[] = [
  {
    slug: "redact-before-compact",
    name: "Redact before compact",
    domain: "memory",
    rule: "Strip keys, tokens, passwords, and connection strings before any compact or export.",
    enabled: true,
  },
  {
    slug: "human-gate-destructive",
    name: "Human gate for destructive Linux",
    domain: "codegen",
    rule: "Package, firewall, user, and recursive-delete scripts require admin confirm before run.",
    enabled: true,
  },
  {
    slug: "no-full-library-prompts",
    name: "No full-library prompts",
    domain: "tokens",
    rule: "Generations may include at most three skill protocols unless an admin overrides.",
    enabled: true,
  },
  {
    slug: "connector-least-privilege",
    name: "Connector least privilege",
    domain: "connectors",
    rule: "Default to read-only connector tools. Writes need a separate confirm.",
    enabled: true,
  },
  {
    slug: "agent-allowlist",
    name: "Agent tool allowlist",
    domain: "agents",
    rule: "Agents may only use tools named in installed skills. Missing skill → deny.",
    enabled: true,
  },
  {
    slug: "token-budget-2k",
    name: "Pre-plan budget 2k",
    domain: "tokens",
    rule: "If estimated prompt tokens exceed 2000, compact or drop skills before calling the model.",
    enabled: true,
  },
  {
    slug: "improver-proposes-only",
    name: "Improver proposes, human merges",
    domain: "agents",
    rule: "The loop improver may draft one skill edit per cycle. It cannot install, overwrite, or run that edit.",
    enabled: true,
  },
];

export const CONNECTOR_CATALOG = [
  {
    provider: "GoogleDrive",
    label: "Google Drive",
    blurb: "Pull briefs and store compacted reports as documents.",
  },
  {
    provider: "Gmail",
    label: "Gmail",
    blurb: "File daily tutor reports; never auto-send without a gate.",
  },
  {
    provider: "GoogleCalendar",
    label: "Google Calendar",
    blurb: "Block time for compact and the daily briefing.",
  },
  {
    provider: "Outlook",
    label: "Outlook",
    blurb: "Mail and files for operators on Microsoft tenants.",
  },
  {
    provider: "OutlookCalendar",
    label: "Outlook Calendar",
    blurb: "Schedule oversight reviews on the work calendar.",
  },
  {
    provider: "MicrosoftTeams",
    label: "Microsoft Teams",
    blurb: "Post flagged-pattern alerts to an ops channel.",
  },
] as const;

export function skillBySlug(slug: string): CatalogSkill | undefined {
  return SKILL_CATALOG.find((s) => s.slug === slug);
}
