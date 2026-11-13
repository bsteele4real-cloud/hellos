import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, tokenizeInline } from "./markdown.ts";

describe("protocol markdown", () => {
  it("turns headings and lists into blocks and keeps html as text", () => {
    const blocks = parseMarkdown(
      "# Title\n\n## Purpose\n\n<script>alert(1)</script>\n\n- Keep secrets out\n- `compact` first\n\n1. Confirm\n",
    );
    assert.deepEqual(
      blocks.map((block) => block.type),
      ["heading", "heading", "paragraph", "ul", "ol"],
    );
    const paragraph = blocks[2];
    assert.equal(paragraph?.type, "paragraph");
    if (paragraph?.type === "paragraph") {
      assert.match(paragraph.text, /<script>alert\(1\)<\/script>/);
    }
    const list = blocks[3];
    assert.equal(list?.type, "ul");
    if (list?.type === "ul") assert.equal(list.items[1], "`compact` first");
    assert.equal(blocks.some((block) => (block as { type: string }).type === "html"), false);
  });

  it("splits inline code and strong text without interpreting tags", () => {
    const parts = tokenizeInline("Use `rm -rf` only after **confirm** <b>no</b>");
    assert.deepEqual(parts, [
      { type: "text", value: "Use " },
      { type: "code", value: "rm -rf" },
      { type: "text", value: " only after " },
      { type: "strong", value: "confirm" },
      { type: "text", value: " <b>no</b>" },
    ]);
  });
});
