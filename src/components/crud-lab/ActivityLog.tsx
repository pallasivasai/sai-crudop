export type LogEntry = {
  id: number;
  op: string;
  sql: string;
  detail: string;
  ok: boolean;
  time: string;
};

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="panel p-5">
      <p className="label-mono">Behind the scenes (SQL log)</p>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Inka action cheyyaledu. Item add / edit / delete cheste, ikkada asalu DB ki
            velle query kanipistundi.
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="animate-rise rounded-lg border border-border bg-secondary/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-mono text-[0.7rem] tracking-widest ${
                  e.ok ? "text-primary" : "text-destructive"
                }`}
              >
                {e.op}
              </span>
              <span className="font-mono text-[0.7rem] text-muted-foreground">{e.time}</span>
            </div>
            <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
              {e.sql}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}