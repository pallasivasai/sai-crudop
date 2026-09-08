import { AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TYPE_META, ruleSummary, type LabField, type RowValues } from "./schema";

export function DynamicForm({
  fields,
  values,
  onChange,
  errors = {},
  compact = false,
}: {
  fields: LabField[];
  values: RowValues;
  onChange: (key: string, value: string | boolean) => void;
  errors?: Record<string, string>;
  compact?: boolean;
}) {
  const visible = fields.filter((f) => f.inForm);

  if (visible.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        Form ki fields select cheyyandi.
      </p>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
      {visible.map((f) => {
        const err = errors[f.key];
        const rules = ruleSummary(f);
        return (
          <label key={f.key} className="animate-rise block space-y-1.5">
            <span className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              {f.label}
              {f.rules?.required && <span className="text-destructive">*</span>}
              <span className="rounded border border-border px-1 text-[0.6rem] normal-case tracking-normal">
                {TYPE_META[f.type].sql}
              </span>
              {rules.length > 0 && (
                <span className="rounded border border-accent/40 bg-accent/10 px-1 text-[0.6rem] normal-case tracking-normal text-accent">
                  {rules.join(" · ")}
                </span>
              )}
            </span>
            {f.type === "boolean" ? (
              <span
                className={`flex h-9 items-center gap-3 rounded-md border bg-secondary/40 px-3 ${
                  err ? "border-destructive" : "border-input"
                }`}
              >
                <Switch
                  checked={Boolean(values[f.key])}
                  onCheckedChange={(v) => onChange(f.key, v)}
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {values[f.key] ? "true" : "false"}
                </span>
              </span>
            ) : (
              <Input
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                value={(values[f.key] ?? "") as string | number}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.label}
                aria-invalid={err ? true : undefined}
                className={`font-mono ${err ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
              />
            )}
            {err && (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {err}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
