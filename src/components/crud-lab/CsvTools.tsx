import { useRef } from "react";
import { Download, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LabField } from "./schema";

export function CsvTools({
  fields,
  rowCount,
  busy,
  onExport,
  onImport,
}: {
  fields: LabField[];
  rowCount: number;
  busy: boolean;
  onExport: () => void;
  onImport: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cols = fields.filter((f) => f.inTable);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono">Bonus · CSV import / export</p>
        <span className="font-mono text-xs text-muted-foreground">
          {cols.length} cols · {rowCount} rows
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Export chesthe ippudu table lo choopisthunna columns matrame CSV avutayi. Import
        chesthe header lo unna column names ni ee fields ki match chesi rows insert avutayi.
      </p>
      <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-md border border-border/70 bg-background/60 px-3 py-2 font-mono text-xs text-accent">
        {cols.map((c) => c.key).join(",") || "(no columns selected)"}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onExport} disabled={cols.length === 0}>
          <Download className="size-4" /> Export CSV
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Import CSV
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            onImport(await file.text());
          }}
        />
      </div>
    </div>
  );
}
