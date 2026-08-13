import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TYPE_META, type LabField, type RowValues } from "./schema";

export function DynamicForm({
  fields,
  values,
  onChange,
  compact = false,
}: {
  fields: LabField[];
  values: RowValues;
  onChange: (key: string, value: string | boolean) => void;
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
      {visible.map((f) => (
        <label key={f.key} className="animate-rise block space-y-1.5">
          <span className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
            {f.label}
            <span className="rounded border border-border px-1 text-[0.6rem] normal-case tracking-normal">
              {TYPE_META[f.type].sql}
            </span>
          </span>
          {f.type === "boolean" ? (
            <span className="flex h-9 items-center gap-3 rounded-md border border-input bg-secondary/40 px-3">
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
              className="font-mono"
            />
          )}
        </label>
      ))}
    </div>
  );
}