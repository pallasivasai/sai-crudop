export type FieldType = "text" | "number" | "date" | "boolean";

export type LabField = {
  key: string;
  label: string;
  type: FieldType;
  inForm: boolean;
  inTable: boolean;
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

export function slugify(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "field"
  );
}