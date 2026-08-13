import { useState } from "react";
import { Eye, EyeOff, Plus, Sparkles, Table2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FIELD_LIBRARY,
  TYPE_META,
  slugify,
  type FieldType,
  type LabField,
} from "./schema";

const TYPES: FieldType[] = ["text", "number", "date", "boolean"];

export function FieldDesigner({
  fields,
  onChange,
}: {
  fields: LabField[];
  onChange: (next: LabField[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");

  const used = new Set(fields.map((f) => f.key));

  const add = (field: Omit<LabField, "inForm" | "inTable">) => {
    if (used.has(field.key)) return;
    onChange([...fields, { ...field, inForm: true, inTable: true }]);
  };

  const addCustom = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    let key = slugify(trimmed);
    let i = 2;
    while (used.has(key)) key = `${slugify(trimmed)}_${i++}`;
    onChange([...fields, { key, label: trimmed, type, inForm: true, inTable: true }]);
    setLabel("");
  };

  const patch = (key: string, part: Partial<LabField>) =>
    onChange(fields.map((f) => (f.key === key ? { ...f, ...part } : f)));

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono">Step 1 · Columns ni nuvvu design cheyyi</p>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[0.7rem] text-accent">
          {fields.length} fields
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Ee list nunchi field add chesthe kinda form and table automatic ga regenerate avutayi.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FIELD_LIBRARY.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => add(f)}
            disabled={used.has(f.key)}
            className="group flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 font-mono text-xs transition-colors hover:border-primary/60 hover:bg-primary/10 disabled:opacity-35"
          >
            <Plus className="size-3" />
            {f.label}
            <span className="text-[0.65rem] text-muted-foreground">
              {TYPE_META[f.type].sql}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/80 p-3">
        <Sparkles className="size-4 text-accent" />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Custom field label"
          className="h-9 w-44 font-mono"
        />
        <div className="flex overflow-hidden rounded-md border border-border">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-2.5 py-1.5 font-mono text-xs transition-colors ${
                type === t
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={addCustom} disabled={!label.trim()}>
          Add field
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {fields.map((f) => (
          <li
            key={f.key}
            className="animate-rise flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary/10 font-mono text-[0.65rem] text-primary">
              {TYPE_META[f.type].badge}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm">{f.label}</p>
              <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
                data-&gt;&gt;'{f.key}' · {TYPE_META[f.type].sql}
              </p>
            </div>
            <button
              type="button"
              onClick={() => patch(f.key, { inForm: !f.inForm })}
              title="Show in form"
              className={`rounded-md border px-2 py-1.5 transition-colors ${
                f.inForm
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {f.inForm ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => patch(f.key, { inTable: !f.inTable })}
              title="Show in table"
              className={`rounded-md border px-2 py-1.5 transition-colors ${
                f.inTable
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Table2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(fields.filter((x) => x.key !== f.key))}
              title="Remove field"
              className="rounded-md border border-border px-2 py-1.5 text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {fields.length === 0 && (
          <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Field okkati kuda ledu — pina chip press cheyyandi.
          </li>
        )}
      </ul>
    </div>
  );
}