import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio } from "./contrast.ts";
import { formatTokenLabel } from "./token.ts";

function cssColor(name: string): string {
  const css = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match?.[1], `missing --color-${name}`);
  return match[1];
}

describe("text contrast", () => {
  it("keeps subtle text at WCAG AA on the dark surfaces", () => {
    const subtle = cssColor("subtle");
    for (const background of ["bg", "surface", "elevated"]) {
      const ratio = contrastRatio(subtle, cssColor(background));
      assert.ok(ratio >= 4.5, `${subtle} on ${background} is ${ratio.toFixed(2)}`);
    }
  });
});

describe("token labels and chart text", () => {
  it("includes the word tokens on a count", () => {
    assert.equal(formatTokenLabel(640), "640 tokens");
    assert.equal(formatTokenLabel(1), "1 token");
    assert.equal(formatTokenLabel(1200), "1.2k tokens");
  });

  it("gives the week chart a text table and keeps nav labels at 12px", () => {
    const chart = readFileSync(new URL("../../components/week-chart.tsx", import.meta.url), "utf8");
    assert.match(chart, /<table/);
    assert.match(chart, /Tokens saved/);
    assert.match(chart, /sr-only/);
    const shell = readFileSync(new URL("../../components/app-shell.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(shell, /text-\[11px\]/);
    assert.match(shell, /text-xs/);
  });
});
