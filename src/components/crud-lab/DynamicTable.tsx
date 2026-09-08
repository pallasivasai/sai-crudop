import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DynamicForm } from "./DynamicForm";
import { display, type LabField, type RowValues } from "./schema";

export type LabRow = {
  id: string;
  created_at: string;
  data: RowValues;
};

export function DynamicTable({
  fields,
  rows,
  busy,
  editingId,
  editValues,
  editErrors = {},
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSave,
  onDelete,
}: {
  fields: LabField[];
  rows: LabRow[];
  busy: boolean;
  editingId: string | null;
  editValues: RowValues;
  editErrors?: Record<string, string>;
  onEditStart: (row: LabRow) => void;
  onEditCancel: () => void;
  onEditChange: (key: string, value: string | boolean) => void;
  onEditSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cols = fields.filter((f) => f.inTable);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="label-mono">Step 3 · Auto-generated table</p>
        <span className="font-mono text-xs text-muted-foreground">
          {rows.length} rows · {cols.length} cols
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 font-mono text-[0.7rem] uppercase tracking-widest text-primary"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="animate-rise border-b border-border/70 last:border-0">
                {editingId === row.id ? (
                  <td colSpan={cols.length + 1} className="px-4 py-4">
                    <DynamicForm
                      fields={fields}
                      values={editValues}
                      onChange={onEditChange}
                      errors={editErrors}
                      compact
                    />
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={busy} onClick={() => onEditSave(row.id)}>
                        <Check className="size-4" /> Save update
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onEditCancel}>
                        <X className="size-4" /> Cancel
                      </Button>
                    </div>
                  </td>
                ) : (
                  <>
                    {cols.map((c) => (
                      <td key={c.key} className="px-4 py-3 font-mono text-sm">
                        {c.type === "boolean" ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              row.data[c.key]
                                ? "bg-primary/15 text-primary"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {display(c, row.data[c.key])}
                          </span>
                        ) : (
                          display(c, row.data[c.key])
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => onEditStart(row)}
                          aria-label="Edit row"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => onDelete(row.id)}
                          aria-label="Delete row"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length + 1}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Table empty ga undi — pina form fill chesi Insert row press cheyyandi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
