import { SqlBlock, SqlExplain } from "./SqlBlock";

export type LogEntry = {
  id: number;
  op: string;
  sql: string;
  detail: string;
  ok: boolean;
  time: string;
  explain?: Array<[string, string]>;
};

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="panel p-5">
      <p className="label-mono">Behind the scenes (SQL log + line-by-line meaning)</p>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Inka action cheyyaledu. Item add / edit / delete cheste, ikkada asalu DB ki
            velle query and daani prathi clause artham kanipistundi.
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
            <div className="mt-2">
              <SqlBlock sql={e.sql} />
            </div>
            {e.explain && <SqlExplain parts={e.explain} />}
            <p className="mt-2 text-xs text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
