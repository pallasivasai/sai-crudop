import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Check, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowPipeline, type FlowStage } from "@/components/crud-lab/FlowPipeline";
import { ActivityLog, type LogEntry } from "@/components/crud-lab/ActivityLog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CRUD Lab — Text field nunchi database varaku visual demo" },
      {
        name: "description",
        content:
          "Hands-on CRUD playground: type in a text field and watch each Create, Read, Update and Delete request travel to the database step by step.",
      },
      { property: "og:title", content: "CRUD Lab — visual database playground" },
      {
        property: "og:description",
        content:
          "See exactly how a text field connects to a database: live CRUD actions with an animated request pipeline and SQL log.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrudLab,
});

type Item = {
  id: string;
  name: string;
  note: string | null;
  created_at: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function CrudLab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [stage, setStage] = useState<FlowStage>(0);
  const [op, setOp] = useState("IDLE");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);

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
  ) => {
    setOp(label);
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
    }
  };

  const itemsQuery = useQuery({
    queryKey: ["demo_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_items")
        .select("id, name, note, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["demo_items"] });

  const createMutation = useMutation({
    mutationFn: () =>
      runFlow(
        "CREATE",
        `insert into demo_items (name, note)\nvalues ('${name}', '${note}');`,
        async () => {
          const { data, error } = await supabase
            .from("demo_items")
            .insert({ name, note: note || null })
            .select("id")
            .single();
          if (error) throw error;
          return data;
        },
        (data) => `Kotha row create ayindi. id = ${data.id}`,
      ),
    onSuccess: () => {
      setName("");
      setNote("");
      invalidate();
    },
  });

  const readMutation = useMutation({
    mutationFn: () =>
      runFlow(
        "READ",
        "select id, name, note, created_at\nfrom demo_items\norder by created_at desc;",
        async () => {
          const { data, error } = await supabase
            .from("demo_items")
            .select("id, name, note, created_at")
            .order("created_at", { ascending: false });
          if (error) throw error;
          return (data ?? []) as Item[];
        },
        (rows) => `${rows.length} rows database nunchi fetch ayyayi.`,
      ),
    onSuccess: (rows) => queryClient.setQueryData(["demo_items"], rows),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      runFlow(
        "UPDATE",
        `update demo_items\nset name = '${value}'\nwhere id = '${id}';`,
        async () => {
          const { error } = await supabase.from("demo_items").update({ name: value }).eq("id", id);
          if (error) throw error;
          return id;
        },
        () => "Aa okka row matrame update ayindi (where id = ...).",
      ),
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
        <p className="label-mono">Hands-on lab · table: demo_items</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          CRUD Lab
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Text field lo type chesi button press cheyyandi. Mee data browser nunchi app code,
          Cloud API dwara database table varaku ela veltundo — right side lo step-by-step
          animation and asalu SQL query kanipistundi.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="space-y-6">
          <div className="panel p-5">
            <p className="label-mono">Create — text field to database</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Item name (e.g. Pen)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-mono"
              />
              <Input
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={busy || name.trim().length === 0}
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

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="label-mono">Rows in database</p>
              <span className="font-mono text-xs text-muted-foreground">{items.length} rows</span>
            </div>

            {itemsQuery.isPending && (
              <p className="px-5 py-6 text-sm text-muted-foreground">Loading rows…</p>
            )}
            {itemsQuery.isError && (
              <p className="px-5 py-6 text-sm text-destructive">
                Rows load avvaledu: {(itemsQuery.error as Error).message}
              </p>
            )}
            {!itemsQuery.isPending && items.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Table empty ga undi. Pina text field lo okati add cheyyandi.
              </p>
            )}

            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    {editingId === item.id ? (
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="font-mono"
                      />
                    ) : (
                      <>
                        <p className="truncate font-mono text-sm">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.note ?? "—"} · id {item.id.slice(0, 8)}…
                        </p>
                      </>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        disabled={busy || editName.trim().length === 0}
                        onClick={() => updateMutation.mutate({ id: item.id, value: editName })}
                        aria-label="Save row"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel edit"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                        }}
                        aria-label="Edit row"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => deleteMutation.mutate(item.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <FlowPipeline stage={stage} op={op} />
          <ActivityLog entries={logs} />
        </section>
      </div>
    </main>
  );
}
