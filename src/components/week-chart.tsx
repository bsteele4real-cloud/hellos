import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportRow } from "@/lib/fns/workspace";

export function WeekChart({ reports }: { reports: ReportRow[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div
        className="h-48 animate-pulse rounded-xl bg-elevated"
        role="status"
        aria-label="Loading token chart"
      />
    );
  }
  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted">
        No token history yet. It shows up after you shorten notes or generate a skill.
      </p>
    );
  }
  const data = reports.map((r) => ({
    day: r.report_date.slice(5),
    saved: r.tokens_saved,
    spent: r.tokens_spent,
    prod: r.productivity,
  }));
  return (
    <div className="h-48 w-full">
      <table className="sr-only">
        <caption>Tokens saved and spent by day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Tokens saved</th>
            <th>Tokens spent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.day}>
              <th scope="row">{row.day}</th>
              <td>{row.saved} tokens saved</td>
              <td>{row.spent} tokens spent</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-fg)",
              }}
            />
            <Area
              type="monotone"
              dataKey="saved"
              stroke="var(--color-signal)"
              fill="var(--color-signal)"
              fillOpacity={0.18}
              strokeWidth={1.6}
              name="Tokens saved"
            />
            <Area
              type="monotone"
              dataKey="spent"
              stroke="var(--color-muted)"
              fill="var(--color-muted)"
              fillOpacity={0.08}
              strokeWidth={1.4}
              name="Tokens spent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
