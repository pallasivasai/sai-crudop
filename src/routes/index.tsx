import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FlowPipeline, type FlowStage } from "@/components/crud-lab/FlowPipeline";
import { ActivityLog, type LogEntry } from "@/components/crud-lab/ActivityLog";
import { FieldDesigner } from "@/components/crud-lab/FieldDesigner";
import { DynamicForm } from "@/components/crud-lab/DynamicForm";
import { DynamicTable, type LabRow } from "@/components/crud-lab/DynamicTable";
import {
  DEFAULT_FIELDS,
  coerce,
  emptyValues,
  loadFields,
  saveFields,
  sqlLiteral,
  type LabField,
  type RowValues,
} from "@/components/crud-lab/schema";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sai CRUD Operations Lab — dynamic fields, live database" },
      {
        name: "description",
        content:
          "Design your own columns and watch the form and table auto-generate, then run live Create, Read, Update and Delete calls against a real database with an animated request pipeline.",
      },
      { property: "og:title", content: "Sai CRUD Operations Lab" },
      {
        property: "og:description",
        content:
          "Pick fields, get an auto-generated form and table, and see every CRUD request travel from the browser to the database.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrudLab,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function CrudLab() {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<LabField[]>(DEFAULT_FIELDS);
  const [values, setValues] = useState<RowValues>(() => emptyValues(DEFAULT_FIELDS));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<RowValues>({});
  const [stage, setStage] = useState<FlowStage>(0);
  const [op, setOp] = useState("IDLE");
  const [payload, setPayload] = useState<string | undefined>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);

  useEffect(() => {
    const stored = loadFields();
    if (stored) {
      setFields(stored);
      setValues(emptyValues(stored));
    }
  }, []);

  const updateFields = (next: LabField[]) => {
    setFields(next);
    saveFields(next);
    setValues((prev) => {
      const base = emptyValues(next);
      for (const f of next) if (f.key in prev) base[f.key] = prev[f.key] ?? null;
      return base;
    });
  };

  const pushLog = (entry: Omit<LogEntry, "id" | "time">) => {
    logId.current += 1;
    setLogs((prev) =>
      [
        {
          ...entry,
          id: logId.current,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 8),
    );
  };

  const runFlow = async <T,>(
    label: string,
    sql: string,
    action: () => Promise<T>,
    describe: (result: T) => string,
    packet?: string,
  ) => {
    setOp(label);
    setPayload(packet);
    for (const s of [1, 2, 3] as FlowStage[]) {
      setStage(s);
      await sleep(320);
    }
    try {
      const result = await action();
      setStage(4);
      pushLog({ op: label, sql, detail: describe(result), ok: true });
      return result;
    } catch (error) {
      pushLog({
        op: `${label} — FAILED`,
        sql,
        detail: error instanceof Error ? error.message : "Unknown error",
        ok: false,
      });
      throw error;
    } finally {
      await sleep(900);
      setStage(0);
      setOp("IDLE");
      setPayload(undefined);
    }
  };

  const fetchRows = async (): Promise<LabRow[]> => {
    const { data, error } = await supabase
      .from("demo_items")
      .select("id, name, note, data, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => {
      const json = (r.data ?? {}) as RowValues;
      // legacy rows (created before dynamic fields) still carry name/note columns
      const merged: RowValues =
        Object.keys(json).length > 0 ? json : { name: r.name ?? null, note: r.note ?? null };
      return { id: r.id as string, created_at: r.created_at as string, data: merged };
    });
  };

  const itemsQuery = useQuery({ queryKey: ["demo_items"], queryFn: fetchRows });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["demo_items"] });

  const buildPayload = (source: RowValues) => {
    const out: RowValues = {};
    for (const f of fields.filter((x) => x.inForm)) out[f.key] = coerce(f, source[f.key]);
    return out;
  };

  const jsonSql = (obj: RowValues) =>
    `{ ${Object.entries(obj)
      .map(([k, v]) => `"${k}": ${sqlLiteral(v)}`)
      .join(", ")} }`;

  const createMutation = useMutation({
    mutationFn: () => {
      const body = buildPayload(values);
      const label = String(body[fields.find((f) => f.type === "text")?.key ?? ""] ?? "row");
      return runFlow(
        "CREATE",
        `insert into demo_items (name, data)\nvalues (${sqlLiteral(label)}, '${jsonSql(body)}'::jsonb);`,
        async () => {
          const { data, error } = await supabase
            .from("demo_items")
            .insert({ name: label, data: body as never })
            .select("id")
            .single();
          if (error) throw error;
          return data;
        },
        (data) => `Kotha row create ayindi. id = ${data.id}`,
        JSON.stringify(body, null, 2),
      );
    },
    onSuccess: () => {
      setValues(emptyValues(fields));
      invalidate();
    },
  });

  const readMutation = useMutation({
    mutationFn: () =>
      runFlow(
        "READ",
        `select id, ${fields
          .filter((f) => f.inTable)
          .map((f) => `data->>'${f.key}' as ${f.key}`)
          .join(", ") || "data"}\nfrom demo_items\norder by created_at desc;`,
        fetchRows,
        (rows) => `${rows.length} rows database nunchi fetch ayyayi.`,
      ),
    onSuccess: (rows) => queryClient.setQueryData(["demo_items"], rows),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => {
      const body = buildPayload(editValues);
      const label = String(body[fields.find((f) => f.type === "text")?.key ?? ""] ?? "row");
      return runFlow(
        "UPDATE",
        `update demo_items\nset name = ${sqlLiteral(label)}, data = '${jsonSql(body)}'::jsonb\nwhere id = '${id}';`,
        async () => {
          const { error } = await supabase
            .from("demo_items")
            .update({ name: label, data: body as never })
            .eq("id", id);
          if (error) throw error;
          return id;
        },
        () => "Aa okka row matrame update ayindi (where id = ...).",
        JSON.stringify(body, null, 2),
      );
    },
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      runFlow(
        "DELETE",
        `delete from demo_items\nwhere id = '${id}';`,
        async () => {
          const { error } = await supabase.from("demo_items").delete().eq("id", id);
          if (error) throw error;
          return id;
        },
        () => "Row permanent ga database nunchi delete ayindi.",
      ),
    onSuccess: invalidate,
  });

  const busy =
    createMutation.isPending ||
    readMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const items = itemsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
      <header className="max-w-2xl">
        <p className="label-mono">Hands-on lab · table: demo_items (data jsonb)</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Sai CRUD Operations Lab
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Mundhu columns/fields select cheyyandi — form and table automatic ga generate
          avutayi. Taruvatha Insert / Fetch / Update / Delete press chesthe, mee data
          browser nunchi database varaku ela veltundo animation and asalu SQL query lo
          kanipistundi.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="space-y-6">
          <FieldDesigner fields={fields} onChange={updateFields} />

          <div className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="label-mono">Step 2 · Auto-generated form</p>
              <span className="font-mono text-xs text-muted-foreground">
                {fields.filter((f) => f.inForm).length} inputs
              </span>
            </div>
            <div className="mt-4">
              <DynamicForm
                fields={fields}
                values={values}
                onChange={(key, value) => setValues((p) => ({ ...p, [key]: value }))}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={busy || fields.filter((f) => f.inForm).length === 0}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Insert row
              </Button>
              <Button variant="secondary" onClick={() => readMutation.mutate()} disabled={busy}>
                {readMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Fetch from DB
              </Button>
            </div>
          </div>

          {itemsQuery.isError ? (
            <p className="panel px-5 py-6 text-sm text-destructive">
              Rows load avvaledu: {(itemsQuery.error as Error).message}
            </p>
          ) : (
            <DynamicTable
              fields={fields}
              rows={items}
              busy={busy}
              editingId={editingId}
              editValues={editValues}
              onEditStart={(row) => {
                setEditingId(row.id);
                setEditValues({ ...emptyValues(fields), ...row.data });
              }}
              onEditCancel={() => setEditingId(null)}
              onEditChange={(key, value) => setEditValues((p) => ({ ...p, [key]: value }))}
              onEditSave={(id) => updateMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
        </section>

        <section className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <FlowPipeline stage={stage} op={op} payload={payload} />
          <ActivityLog entries={logs} />
        </section>
      </div>
    </main>
  );
}
