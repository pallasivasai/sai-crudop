export type FieldType = "text" | "number" | "date" | "boolean";

export type FieldRules = {
  required?: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string;
};

export type LabField = {
  key: string;
  label: string;
  type: FieldType;
  inForm: boolean;
  inTable: boolean;
  rules?: FieldRules;
};

export const FIELD_LIBRARY: Array<Omit<LabField, "inForm" | "inTable">> = [
  { key: "name", label: "Name", type: "text" },
  { key: "note", label: "Note", type: "text" },
  { key: "qty", label: "Quantity", type: "number" },
  { key: "price", label: "Price", type: "number" },
  { key: "category", label: "Category", type: "text" },
  { key: "due_date", label: "Due date", type: "date" },
  { key: "email", label: "Email", type: "text" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "done", label: "Done", type: "boolean" },
  { key: "favourite", label: "Favourite", type: "boolean" },
];

export const DEFAULT_FIELDS: LabField[] = [
  { key: "name", label: "Name", type: "text", inForm: true, inTable: true },
  { key: "qty", label: "Quantity", type: "number", inForm: true, inTable: true },
  { key: "done", label: "Done", type: "boolean", inForm: true, inTable: true },
];

export const TYPE_META: Record<FieldType, { sql: string; badge: string }> = {
  text: { sql: "text", badge: "Aa" },
  number: { sql: "numeric", badge: "12" },
  date: { sql: "date", badge: "cal" },
  boolean: { sql: "boolean", badge: "0/1" },
};

export type RowValues = Record<string, string | number | boolean | null>;

export function emptyValues(fields: LabField[]): RowValues {
  const out: RowValues = {};
  for (const f of fields) out[f.key] = f.type === "boolean" ? false : "";
  return out;
}

export function coerce(field: LabField, raw: unknown): string | number | boolean | null {
  if (field.type === "boolean") return Boolean(raw);
  if (field.type === "number") {
    if (raw === "" || raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  const s = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  return s.trim() === "" ? null : s;
}

export function display(field: LabField, raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.type === "boolean") return raw ? "true" : "false";
  return String(raw);
}

export function sqlLiteral(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${value.replace(/'/g, "''")}'`;
}

const STORAGE_KEY = "sai-crud-lab-fields";

export function loadFields(): LabField[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LabField[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveFields(fields: LabField[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  } catch {
    /* ignore */
  }
}

export function ruleSummary(f: LabField): string[] {
  const r = f.rules ?? {};
  const out: string[] = [];
  if (r.required) out.push("required");
  if (r.min !== null && r.min !== undefined)
    out.push(f.type === "number" ? `min ${r.min}` : `min len ${r.min}`);
  if (r.max !== null && r.max !== undefined)
    out.push(f.type === "number" ? `max ${r.max}` : `max len ${r.max}`);
  if (r.pattern) out.push(`pattern /${r.pattern}/`);
  return out;
}

/** Returns { fieldKey: message } for every rule that fails. */
export function validateValues(
  fields: LabField[],
  values: RowValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields.filter((x) => x.inForm)) {
    const r = f.rules ?? {};
    const raw = values[f.key];
    const value = coerce(f, raw);

    if (f.type === "boolean") {
      if (r.required && value !== true) errors[f.key] = `${f.label} ni on cheyyali.`;
      continue;
    }

    if (value === null) {
      if (r.required) errors[f.key] = `${f.label} required — khali vadhu.`;
      continue;
    }

    if (f.type === "number") {
      const n = value as number;
      if (r.min !== null && r.min !== undefined && n < r.min)
        errors[f.key] = `${f.label} minimum ${r.min} undali.`;
      else if (r.max !== null && r.max !== undefined && n > r.max)
        errors[f.key] = `${f.label} maximum ${r.max} varake.`;
      continue;
    }

    const s = String(value);
    if (r.min !== null && r.min !== undefined && s.length < r.min)
      errors[f.key] = `${f.label} lo minimum ${r.min} characters kavali.`;
    else if (r.max !== null && r.max !== undefined && s.length > r.max)
      errors[f.key] = `${f.label} lo maximum ${r.max} characters matrame.`;
    else if (r.pattern) {
      try {
        if (!new RegExp(r.pattern).test(s))
          errors[f.key] = `${f.label} ee pattern ki match avvaledu: /${r.pattern}/`;
      } catch {
        /* invalid regex — ignore */
      }
    }
  }
  return errors;
}

/* ---------------- CSV ---------------- */

function csvCell(value: string | number | boolean | null): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(fields: LabField[], rows: Array<{ data: RowValues }>): string {
  const cols = fields.filter((f) => f.inTable);
  const head = cols.map((c) => csvCell(c.key)).join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r.data[c.key] ?? null)).join(","));
  return [head, ...body].join("\n");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** CSV text -> row values keyed by the currently selected fields. */
export function csvToRows(fields: LabField[], text: string): RowValues[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = (table[0] ?? []).map((h) => h.trim());
  return table.slice(1).map((cells) => {
    const out: RowValues = {};
    for (const f of fields) {
      const idx = header.findIndex(
        (h) => h === f.key || h.toLowerCase() === f.label.toLowerCase(),
      );
      const raw = idx >= 0 ? cells[idx] : "";
      out[f.key] =
        f.type === "boolean"
          ? /^(true|1|yes|y)$/i.test((raw ?? "").trim())
          : coerce(f, raw);
    }
    return out;
  });
}

export function slugify(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "field"
  );
}