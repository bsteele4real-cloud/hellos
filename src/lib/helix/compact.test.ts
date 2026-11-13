import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compactNote,
  localCompact,
  reportDay,
  savingsFromCompact,
  tokensSavedAfterUndo,
  undoNote,
} from "./compact.ts";

const policies = [{ slug: "redact-before-compact", enabled: true }];

describe("compact undo", () => {
  it("keeps the previous body and can restore it", () => {
    const body = "api_key=supersecretvalue\n\n" + "A decision worth keeping.\n".repeat(8);
    const compacted = compactNote(body, policies);
    assert.equal(compacted.previous, body);
    assert.doesNotMatch(compacted.next, /supersecretvalue/);
    assert.match(compacted.next, /decision worth keeping/);
    assert.ok(compacted.next.length < body.length);
    assert.equal(undoNote(compacted.previous), body);
    assert.equal(undoNote(null), null);
    assert.equal(undoNote(""), null);
  });

  it("removes the saved tokens when a shorten is undone", () => {
    assert.equal(savingsFromCompact(400, 110), 290);
    assert.equal(savingsFromCompact(80, 110), 0);
    assert.equal(tokensSavedAfterUndo(290, 290), 0);
    assert.equal(tokensSavedAfterUndo(500, 290), 210);
    assert.equal(tokensSavedAfterUndo(40, 290), 0);
    assert.equal(reportDay("2026-11-13T08:00:00.000Z"), "2026-11-13");
    assert.equal(reportDay(new Date("2026-11-13T08:00:00.000Z")), "2026-11-13");
    assert.equal(reportDay(null), null);
  });

  it("keeps the first short lines when shortening locally", () => {
    const next = localCompact("# Title\n\n- Keep this\n\n" + "x".repeat(200));
    assert.match(next, /# Title/);
    assert.match(next, /- Keep this/);
  });
});
