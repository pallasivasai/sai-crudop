import { Database, MousePointerClick, Server, Table2 } from "lucide-react";

export type FlowStage = 0 | 1 | 2 | 3 | 4;

const stages = [
  {
    icon: MousePointerClick,
    title: "Dynamic form",
    caption: "Nuvvu design chesina fields lo type chesina data",
  },
  {
    icon: Server,
    title: "App code",
    caption: "React values ni JSON object ga marchi client ni call chestundi",
  },
  {
    icon: Database,
    title: "Cloud API",
    caption: "Secure API request DB ki velthundi",
  },
  {
    icon: Table2,
    title: "demo_items table",
    caption: "data jsonb column lo row insert / update / delete avutundi",
  },
];

export function FlowPipeline({
  stage,
  op,
  payload,
}: {
  stage: FlowStage;
  op: string;
  payload?: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono">Step 4 · Data flow</p>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[0.7rem] tracking-widest text-primary">
          {op}
        </span>
      </div>

      {payload && (
        <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-accent/30 bg-accent/5 p-3 font-mono text-[0.7rem] leading-relaxed text-accent">
          {payload}
        </pre>
      )}

      <div className="mt-5 space-y-3">
        {stages.map((s, i) => {
          const active = stage > i;
          const current = stage === i + 1;
          const Icon = s.icon;
          return (
            <div key={s.title}>
              <div
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all duration-300 ${
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-secondary/40 opacity-70"
                } ${current ? "animate-pulse-node" : ""}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-md border transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium">
                    {i + 1}. {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.caption}</p>
                </div>
              </div>

              {i < stages.length - 1 && (
                <div className="relative mx-8 h-6">
                  <span className="absolute inset-y-0 left-0 w-px bg-border" />
                  {stage === i + 1 && (
                    <span className="absolute left-[-3px] top-1 size-[7px] rounded-full bg-primary shadow-[0_0_12px_2px_var(--color-primary)]" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}