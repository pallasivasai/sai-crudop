const KEYWORDS = [
  "insert into",
  "values",
  "select",
  "from",
  "where",
  "order by",
  "update",
  "set",
  "delete from",
  "desc",
  "asc",
  "and",
  "as",
  "null",
  "true",
  "false",
];

type Piece = { text: string; kind: "kw" | "str" | "plain" };

/** Very small tokenizer: enough to colour keywords and string literals. */
function tokenize(sql: string): Piece[] {
  const pattern = new RegExp(
    `('(?:[^']|'')*'|::jsonb|\\b(?:${KEYWORDS.map((k) => k.replace(/ /g, "\\s+")).join("|")})\\b)`,
    "gi",
  );
  const out: Piece[] = [];
  let last = 0;
  for (const m of sql.matchAll(pattern)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: sql.slice(last, i), kind: "plain" });
    out.push({ text: m[0], kind: m[0].startsWith("'") ? "str" : "kw" });
    last = i + m[0].length;
  }
  if (last < sql.length) out.push({ text: sql.slice(last), kind: "plain" });
  return out;
}

export function SqlBlock({ sql }: { sql: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 font-mono text-xs leading-relaxed">
      {tokenize(sql).map((p, i) => (
        <span
          key={i}
          className={
            p.kind === "kw"
              ? "font-semibold uppercase text-primary"
              : p.kind === "str"
                ? "text-accent"
                : "text-foreground/85"
          }
        >
          {p.text}
        </span>
      ))}
    </pre>
  );
}

/** Clause-by-clause plain-language breakdown of the query. */
export function SqlExplain({ parts }: { parts: Array<[string, string]> }) {
  if (parts.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {parts.map(([clause, meaning]) => (
        <li key={clause} className="flex gap-2 text-xs">
          <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-primary">
            {clause}
          </span>
          <span className="text-muted-foreground">{meaning}</span>
        </li>
      ))}
    </ul>
  );
}
