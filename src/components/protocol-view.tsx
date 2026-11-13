import { parseMarkdown, tokenizeInline, type InlinePart } from "@/lib/helix/markdown";

function Inline({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((part, index) => (
        <InlinePartView key={index} part={part} />
      ))}
    </>
  );
}

function InlinePartView({ part }: { part: InlinePart }) {
  if (part.type === "code") {
    return <code className="rounded bg-elevated px-1 font-mono text-[0.92em]">{part.value}</code>;
  }
  if (part.type === "strong") return <strong className="font-medium text-fg">{part.value}</strong>;
  return <>{part.value}</>;
}

export function ProtocolView({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-fg">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 1)
            return (
              <h2 key={index} className="font-serif text-2xl">
                {block.text}
              </h2>
            );
          if (block.level === 2)
            return (
              <h3 key={index} className="font-serif text-xl">
                {block.text}
              </h3>
            );
          return (
            <h4 key={index} className="font-medium">
              {block.text}
            </h4>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs leading-relaxed text-muted"
            >
              {block.text}
            </pre>
          );
        }
        return (
          <p key={index}>
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
