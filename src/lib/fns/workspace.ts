import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CONNECTOR_CATALOG } from "@/lib/helix/catalog";
import { fallbackLinuxScript, fallbackProtocol } from "@/lib/helix/linux";
import {
  isoDaysAgo,
  seedMemories,
  seedMistakes,
  seedPolicies,
  seedSkills,
} from "@/lib/helix/seed";
import { compactBudget, estimateTokens } from "@/lib/helix/token";

export type ProfileRow = {
  user_id: string;
  initialized_at: string | null;
  last_compact_at: string | null;
  last_report_at: string | null;
  role: string;
  created_at: string;
};

export type SkillRow = {
  id: number;
  slug: string;
  name: string;
  category: string;
  summary: string;
  protocol: string;
  linux_script: string | null;
  installed: boolean;
  token_cost: number;
  origin: string;
  created_at: string;
};

export type MemoryRow = {
  id: number;
  title: string;
  body: string;
  tags: string;
  compacted: boolean;
  token_estimate: number;
  created_at: string;
};

export type EventRow = {
  id: number;
  kind: string;
  label: string;
  detail: string;
  severity: string;
  created_at: string;
};

export type MistakeRow = {
  id: number;
  pattern: string;
  count: number;
  flagged: boolean;
  tutor_note: string;
  last_seen: string;
};

export type PolicyRow = {
  id: number;
  slug: string;
  name: string;
  domain: string;
  rule: string;
  enabled: boolean;
};

export type ReportRow = {
  id: number;
  report_date: string;
  summary: string;
  productivity: number;
  tokens_saved: number;
  tokens_spent: number;
  mistakes_flagged: number;
  actions: number;
};

export type ConnectorRow = {
  id: number;
  provider: string;
  status: string;
  last_sync: string | null;
  detail: string;
};

export type ComboRow = {
  id: number;
  name: string;
  slugs: string;
  protocol: string;
  created_at: string;
};

export type Workspace = {
  profile: ProfileRow;
  skills: SkillRow[];
  memories: MemoryRow[];
  events: EventRow[];
  mistakes: MistakeRow[];
  policies: PolicyRow[];
  reports: ReportRow[];
  connectors: ConnectorRow[];
  combos: ComboRow[];
};

async function syncCatalog(userId: string) {
  const sql = await getSql();
  const have = await sql<{ slug: string }>`
    select slug from helix_skills where user_id = ${userId} and origin = 'catalog'`;
  const known = new Set(have.map((r) => r.slug));
  for (const s of seedSkills()) {
    if (known.has(s.slug)) continue;
    await sql`insert into helix_skills (user_id, slug, name, category, summary, protocol, linux_script, installed, token_cost, origin)
      values (${userId}, ${s.slug}, ${s.name}, ${s.category}, ${s.summary}, ${s.protocol}, ${s.linux_script}, ${s.installed}, ${s.token_cost}, ${s.origin})
      on conflict (user_id, slug) do nothing`;
  }
  const pols = await sql<{ slug: string }>`
    select slug from helix_policies where user_id = ${userId}`;
  const knownPolicies = new Set(pols.map((r) => r.slug));
  for (const p of seedPolicies()) {
    if (knownPolicies.has(p.slug)) continue;
    await sql`insert into helix_policies (user_id, slug, name, domain, rule, enabled)
      values (${userId}, ${p.slug}, ${p.name}, ${p.domain}, ${p.rule}, ${p.enabled})
      on conflict (user_id, slug) do nothing`;
  }
}

async function loadWorkspace(userId: string): Promise<Workspace> {
  const sql = await getSql();
  await sql`insert into helix_profiles (user_id) values (${userId}) on conflict (user_id) do nothing`;

  const profiles = await sql<ProfileRow>`
    select user_id, initialized_at, last_compact_at, last_report_at, role, created_at
    from helix_profiles where user_id = ${userId}`;
  const profile = profiles[0]!;
  if (profile.initialized_at) await syncCatalog(userId);

  const [skills, memories, events, mistakes, policies, reports, connectors, combos] =
    await Promise.all([
      sql<SkillRow>`select id, slug, name, category, summary, protocol, linux_script, installed, token_cost, origin, created_at from helix_skills where user_id = ${userId} order by name`,
      sql<MemoryRow>`select id, title, body, tags, compacted, token_estimate, created_at from helix_memory where user_id = ${userId} order by created_at desc`,
      sql<EventRow>`select id, kind, label, detail, severity, created_at from helix_events where user_id = ${userId} order by created_at desc limit 80`,
      sql<MistakeRow>`select id, pattern, count, flagged, tutor_note, last_seen from helix_mistakes where user_id = ${userId} order by count desc`,
      sql<PolicyRow>`select id, slug, name, domain, rule, enabled from helix_policies where user_id = ${userId} order by name`,
      sql<ReportRow>`select id, report_date, summary, productivity, tokens_saved, tokens_spent, mistakes_flagged, actions from helix_reports where user_id = ${userId} order by report_date`,
      sql<ConnectorRow>`select id, provider, status, last_sync, detail from helix_connectors where user_id = ${userId} order by provider`,
      sql<ComboRow>`select id, name, slugs, protocol, created_at from helix_combos where user_id = ${userId} order by created_at desc`,
    ]);

  return {
    profile,
    skills,
    memories,
    events,
    mistakes,
    policies,
    reports,
    connectors,
    combos,
  };
}

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => loadWorkspace(context.userId));

export const runInit = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const uid = context.userId;
    await sql`insert into helix_profiles (user_id) values (${uid}) on conflict (user_id) do nothing`;

    const existing = await sql<{ initialized_at: string | null }>`
      select initialized_at from helix_profiles where user_id = ${uid}`;
    if (existing[0]?.initialized_at) {
      await sql`insert into helix_events (user_id, kind, label, detail, severity)
        values (${uid}, 'init', 'Init refresh', 'Workspace already bound. Recording continues.', 'info')`;
      return loadWorkspace(uid);
    }

    for (const s of seedSkills()) {
      await sql`insert into helix_skills (user_id, slug, name, category, summary, protocol, linux_script, installed, token_cost, origin)
        values (${uid}, ${s.slug}, ${s.name}, ${s.category}, ${s.summary}, ${s.protocol}, ${s.linux_script}, ${s.installed}, ${s.token_cost}, ${s.origin})
        on conflict (user_id, slug) do nothing`;
    }
    for (const p of seedPolicies()) {
      await sql`insert into helix_policies (user_id, slug, name, domain, rule, enabled)
        values (${uid}, ${p.slug}, ${p.name}, ${p.domain}, ${p.rule}, ${p.enabled})
        on conflict (user_id, slug) do nothing`;
    }
    for (const m of seedMemories()) {
      await sql`insert into helix_memory (user_id, title, body, tags, token_estimate)
        values (${uid}, ${m.title}, ${m.body}, ${m.tags}, ${m.token_estimate})`;
    }
    for (const m of seedMistakes) {
      await sql`insert into helix_mistakes (user_id, pattern, count, flagged, tutor_note)
        values (${uid}, ${m.pattern}, ${m.count}, ${m.flagged}, ${m.tutor_note})
        on conflict (user_id, pattern) do nothing`;
    }
    for (const c of CONNECTOR_CATALOG) {
      await sql`insert into helix_connectors (user_id, provider, status, detail)
        values (${uid}, ${c.provider}, 'idle', ${c.blurb})
        on conflict (user_id, provider) do nothing`;
    }

    const eventPlan: { days: number; hour: number; kind: string; label: string; detail: string; severity: string }[] = [
      { days: 6, hour: 8, kind: "action", label: "Pre-planned token budget", detail: "Dropped two unused skills from the prompt.", severity: "info" },
      { days: 6, hour: 18, kind: "mistake", label: "Skipped compact", detail: "Pasted full memory into generation.", severity: "warn" },
      { days: 5, hour: 9, kind: "action", label: "Installed workflow-optimizer", detail: "Tutor loop armed.", severity: "info" },
      { days: 4, hour: 11, kind: "mistake", label: "Ran script with sudo", detail: "Generated job did not need root.", severity: "flag" },
      { days: 3, hour: 8, kind: "compact", label: "Morning compact", detail: "Saved 1.2k tokens.", severity: "info" },
      { days: 3, hour: 16, kind: "generate", label: "udev rule draft", detail: "Android host script, uninstalled.", severity: "info" },
      { days: 2, hour: 10, kind: "mistake", label: "Skipped compact", detail: "Third occurrence this week.", severity: "flag" },
      { days: 1, hour: 8, kind: "action", label: "Daily briefing", detail: "Flagged three patterns.", severity: "info" },
      { days: 1, hour: 15, kind: "policy", label: "Enabled human-gate-destructive", detail: "Governor armed.", severity: "info" },
      { days: 0, hour: 8, kind: "init", label: "Workspace initialized", detail: "User bound. Analytics live.", severity: "info" },
    ];
    for (const e of eventPlan) {
      await sql`insert into helix_events (user_id, kind, label, detail, severity, created_at)
        values (${uid}, ${e.kind}, ${e.label}, ${e.detail}, ${e.severity}, ${isoDaysAgo(e.days, e.hour)})`;
    }

    for (let d = 6; d >= 0; d--) {
      const date = isoDaysAgo(d, 12).slice(0, 10);
      const productivity = 58 + (6 - d) * 4 + (d === 4 ? -12 : 0);
      const tokensSaved = 200 + d * 90;
      const tokensSpent = 420 - d * 20;
      const mistakesFlagged = d === 4 || d === 2 || d === 0 ? 1 : 0;
      const actions = 6 + ((6 - d) % 4);
      const summary =
        d === 0
          ? "Init complete. Three flagged loops remain. Compact before the next generation."
          : `Day window ${date}: productivity ${productivity}, saved ${tokensSaved} tokens.`;
      await sql`insert into helix_reports (user_id, report_date, summary, productivity, tokens_saved, tokens_spent, mistakes_flagged, actions)
        values (${uid}, ${date}, ${summary}, ${productivity}, ${tokensSaved}, ${tokensSpent}, ${mistakesFlagged}, ${actions})
        on conflict (user_id, report_date) do nothing`;
    }

    await sql`update helix_profiles set initialized_at = now(), role = 'admin' where user_id = ${uid}`;
    return loadWorkspace(uid);
  });

export const addMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; body: string; tags: string }) => ({
    title: input.title.trim().slice(0, 120),
    body: input.body.trim().slice(0, 8000),
    tags: input.tags.trim().slice(0, 160),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title || !data.body) return loadWorkspace(context.userId);
    const sql = await getSql();
    const tokens = estimateTokens(data.body);
    await sql`insert into helix_memory (user_id, title, body, tags, token_estimate)
      values (${context.userId}, ${data.title}, ${data.body}, ${data.tags}, ${tokens})`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'action', ${"Memory: " + data.title}, ${tokens + " tokens written"})`;
    return loadWorkspace(context.userId);
  });

function localCompact(body: string): string {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const keep = lines.filter(
    (l, i) => i === 0 || /^(#|-|\d+\.)/.test(l) || l.length < 140,
  );
  const text = (keep.length ? keep : lines.slice(0, 4)).join("\n");
  return text.slice(0, 900);
}

async function askGrok(prompt: string, maxTokens: number): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content:
            "You are Helix, an operator second-brain. Be terse. No preamble. No markdown fences unless asked for a script.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content?.trim() || null;
}

export const compactMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<MemoryRow>`
      select id, title, body, tags, compacted, token_estimate, created_at
      from helix_memory where user_id = ${context.userId} and compacted = false`;
    if (rows.length === 0) {
      await sql`insert into helix_events (user_id, kind, label, detail)
        values (${context.userId}, 'compact', 'Compact skipped', 'Nothing left to compact.')`;
      return { workspace: await loadWorkspace(context.userId), saved: 0, notes: 0 };
    }

    let saved = 0;
    let spent = 0;
    for (const row of rows) {
      const before = row.token_estimate || estimateTokens(row.body);
      let compacted = localCompact(row.body);
      const ai = await askGrok(
        `Compact this operator memory. Keep titles, decisions, paths, names. Drop narration. Output the compacted note only.\n\nTitle: ${row.title}\n\n${row.body}`,
        280,
      );
      if (ai) {
        compacted = ai;
        spent += 280;
      }
      const after = estimateTokens(compacted);
      saved += Math.max(0, before - after);
      await sql`update helix_memory set body = ${compacted}, compacted = true, token_estimate = ${after}
        where id = ${row.id} and user_id = ${context.userId}`;
    }

    await sql`update helix_profiles set last_compact_at = now() where user_id = ${context.userId}`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'compact', 'Compact complete', ${`Saved ${saved} tokens across ${rows.length} notes.`})`;

    const today = new Date().toISOString().slice(0, 10);
    await sql`insert into helix_reports (user_id, report_date, summary, tokens_saved, tokens_spent, actions)
      values (${context.userId}, ${today}, ${"Compacted " + rows.length + " notes."}, ${saved}, ${spent}, 1)
      on conflict (user_id, report_date) do update set
        tokens_saved = helix_reports.tokens_saved + excluded.tokens_saved,
        tokens_spent = helix_reports.tokens_spent + excluded.tokens_spent,
        actions = helix_reports.actions + 1`;

    return { workspace: await loadWorkspace(context.userId), saved, notes: rows.length };
  });

function normalizePattern(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 140);
}

export const logEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind: "action" | "mistake"; label: string; detail?: string }) => ({
    kind: input.kind,
    label: input.label.trim().slice(0, 160),
    detail: (input.detail ?? "").trim().slice(0, 500),
  }))
  .handler(async ({ context, data }) => {
    if (!data.label) return loadWorkspace(context.userId);
    const sql = await getSql();
    if (data.kind === "mistake") {
      const pattern = normalizePattern(data.label);
      const existing = await sql<MistakeRow>`
        select id, pattern, count, flagged, tutor_note, last_seen
        from helix_mistakes where user_id = ${context.userId} and pattern = ${pattern}`;
      const nextCount = (existing[0]?.count ?? 0) + 1;
      const flagged = nextCount >= 3;
      const tutor =
        existing[0]?.tutor_note ||
        `Repeated ${nextCount}×. Pause and apply the related skill before retrying.`;
      if (existing[0]) {
        await sql`update helix_mistakes set count = ${nextCount}, flagged = ${flagged}, last_seen = now(),
          tutor_note = ${tutor} where id = ${existing[0].id} and user_id = ${context.userId}`;
      } else {
        await sql`insert into helix_mistakes (user_id, pattern, count, flagged, tutor_note)
          values (${context.userId}, ${pattern}, 1, false, ${tutor})`;
      }
      await sql`insert into helix_events (user_id, kind, label, detail, severity)
        values (${context.userId}, 'mistake', ${data.label}, ${data.detail}, ${flagged ? "flag" : "warn"})`;
    } else {
      await sql`insert into helix_events (user_id, kind, label, detail, severity)
        values (${context.userId}, 'action', ${data.label}, ${data.detail}, 'info')`;
    }
    return loadWorkspace(context.userId);
  });

export const toggleSkill = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string; installed: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update helix_skills set installed = ${data.installed}
      where user_id = ${context.userId} and slug = ${data.slug}`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'action', ${data.installed ? "Installed " + data.slug : "Removed " + data.slug}, 'Skill library')`;
    return loadWorkspace(context.userId);
  });

export const togglePolicy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string; enabled: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update helix_policies set enabled = ${data.enabled}
      where user_id = ${context.userId} and slug = ${data.slug}`;
    await sql`insert into helix_events (user_id, kind, label, detail, severity)
      values (${context.userId}, 'policy', ${data.enabled ? "Enabled " + data.slug : "Disabled " + data.slug}, 'Admin governance', 'info')`;
    return loadWorkspace(context.userId);
  });

export const generateSkill = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string; brief: string; target: string; slugs: string[] }) => ({
    name: input.name.trim().slice(0, 80),
    brief: input.brief.trim().slice(0, 2000),
    target: input.target,
    slugs: input.slugs.slice(0, 3),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    let protocol = fallbackProtocol(data);
    let script = fallbackLinuxScript(data);
    const estimate = estimateTokens(protocol + script + data.brief);
    const budget = compactBudget(estimate);

    const ai = await askGrok(
      `Write a Helix skill. Return ONLY JSON with keys protocol (markdown) and script (bash).
Name: ${data.name}
Brief: ${data.brief}
Linux target: ${data.target}
Combine skills: ${data.slugs.join(", ") || "none"}
Rules: bash must start with #!/usr/bin/env bash and set -euo pipefail. No curl|sh. No secrets. User-space paths. Protocol has Purpose, Steps, Out of scope.`,
      900,
    );
    if (ai) {
      try {
        const cleaned = ai.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(cleaned) as {
          protocol?: string;
          script?: string;
        };
        if (parsed.protocol) protocol = parsed.protocol;
        if (parsed.script) script = parsed.script;
      } catch {
        /* keep fallback protocol + script */
      }
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "custom-skill";

    await sql`insert into helix_skills (user_id, slug, name, category, summary, protocol, linux_script, installed, token_cost, origin)
      values (${context.userId}, ${slug + "-" + Date.now().toString(36)}, ${data.name}, 'codegen', ${data.brief.slice(0, 160)}, ${protocol}, ${script}, false, ${estimate}, 'generated')
      on conflict (user_id, slug) do nothing`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'generate', ${"Skill draft: " + data.name}, ${"est " + estimate + " tokens"})`;

    return {
      workspace: await loadWorkspace(context.userId),
      protocol,
      script,
      estimate,
      savedIfCompacted: budget.saved,
    };
  });

export const combineSkills = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string; slugs: string[] }) => ({
    name: input.name.trim().slice(0, 80),
    slugs: input.slugs.filter(Boolean).slice(0, 4),
  }))
  .handler(async ({ context, data }) => {
    if (data.slugs.length < 2) return loadWorkspace(context.userId);
    const sql = await getSql();
    const rows = await sql<SkillRow>`
      select id, slug, name, category, summary, protocol, linux_script, installed, token_cost, origin, created_at
      from helix_skills where user_id = ${context.userId}`;
    const picked = data.slugs
      .map((s) => rows.find((r) => r.slug === s))
      .filter((s): s is SkillRow => Boolean(s));
    const protocol = fallbackProtocol({
      name: data.name || picked.map((p) => p.name).join(" + "),
      brief: `Combined playbook of ${picked.map((p) => p.name).join(", ")}.`,
      slugs: picked.map((p) => p.slug),
    });
    const name = data.name || picked.map((p) => p.name).join(" + ");
    await sql`insert into helix_combos (user_id, name, slugs, protocol)
      values (${context.userId}, ${name}, ${picked.map((p) => p.slug).join(",")}, ${protocol})`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'action', ${"Combo: " + name}, ${picked.map((p) => p.slug).join(", ")})`;
    return loadWorkspace(context.userId);
  });

export const writeDailyReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const ws = await loadWorkspace(context.userId);
    const flagged = ws.mistakes.filter((m) => m.flagged);
    const todayEvents = ws.events.length;
    const tokensSaved = ws.reports.reduce((a, r) => a + r.tokens_saved, 0);
    const top = flagged[0]?.pattern ?? "no flagged pattern";
    let summary = `Today's loop: ${top}. ${flagged.length} flagged patterns. ${todayEvents} recent events. Tokens saved this week: ${tokensSaved}. Compact before the next generation.`;
    const ai = await askGrok(
      `Write a 80-120 word daily tutor briefing for an operator. Be specific, not moralizing.\nFlagged: ${flagged.map((m) => `${m.pattern} (${m.count}×) — ${m.tutor_note}`).join("\n")}\nLatest events: ${ws.events.slice(0, 8).map((e) => e.label).join("; ")}`,
      220,
    );
    if (ai) summary = ai;
    const today = new Date().toISOString().slice(0, 10);
    const productivity = Math.max(
      20,
      Math.min(99, 80 - flagged.length * 8 + Math.min(15, todayEvents)),
    );
    await sql`insert into helix_reports (user_id, report_date, summary, productivity, mistakes_flagged, actions)
      values (${context.userId}, ${today}, ${summary}, ${productivity}, ${flagged.length}, ${todayEvents})
      on conflict (user_id, report_date) do update set
        summary = excluded.summary,
        productivity = excluded.productivity,
        mistakes_flagged = excluded.mistakes_flagged`;
    await sql`update helix_profiles set last_report_at = now() where user_id = ${context.userId}`;
    await sql`insert into helix_events (user_id, kind, label, detail)
      values (${context.userId}, 'action', 'Daily briefing written', ${top})`;
    return loadWorkspace(context.userId);
  });

export const probeConnector = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { provider: string }) => ({
    provider: input.provider,
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const { callTool } = await import("@/lib/app-data/client.server");
    const { ConnectorType } = await import("@/lib/app-data");
    const typeMap: Record<string, (typeof ConnectorType)[keyof typeof ConnectorType]> = {
      GoogleDrive: ConnectorType.GoogleDrive,
      Gmail: ConnectorType.Gmail,
      GoogleCalendar: ConnectorType.GoogleCalendar,
      Outlook: ConnectorType.Outlook,
      OutlookCalendar: ConnectorType.OutlookCalendar,
      MicrosoftTeams: ConnectorType.MicrosoftTeams,
    };
    const connectorType = typeMap[data.provider];
    if (!connectorType) {
      return {
        workspace: await loadWorkspace(context.userId),
        loginUrl: null as string | null,
        loginRequired: false,
      };
    }
    const toolMap: Record<string, { tool: string; args: Record<string, unknown> }> = {
      GoogleDrive: { tool: "google_drive_search", args: { query: "helix" } },
      Gmail: { tool: "gmail_search_messages", args: { query: "in:inbox" } },
      GoogleCalendar: { tool: "google_calendar_list_events", args: {} },
      Outlook: { tool: "outlook_list_messages", args: {} },
      OutlookCalendar: { tool: "outlook_calendar_list_events", args: {} },
      MicrosoftTeams: { tool: "microsoft_teams_list_chats", args: {} },
    };
    const spec = toolMap[data.provider]!;
    const result = await callTool(spec.tool, spec.args, { connectorType });
    let status = "error";
    let detail = result.errorMessage ?? "Unknown connector error";
    if (result.ok) {
      status = "connected";
      detail = "Probe succeeded. Read-only access granted.";
    } else if (result.loginRequired) {
      status = "login";
      detail = result.loginUrl
        ? `Sign in through Grok to grant ${data.provider}.`
        : "Open Helix through Grok to attach this connector.";
    }
    await sql`update helix_connectors set status = ${status}, detail = ${detail}, last_sync = now()
      where user_id = ${context.userId} and provider = ${data.provider}`;
    await sql`insert into helix_events (user_id, kind, label, detail, severity)
      values (${context.userId}, 'connect', ${"Connector " + data.provider}, ${detail}, ${status === "connected" ? "info" : "warn"})`;
    const ws = await loadWorkspace(context.userId);
    return { workspace: ws, loginUrl: result.loginUrl ?? null, loginRequired: Boolean(result.loginRequired) };
  });
