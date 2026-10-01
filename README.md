# Sai CRUD Operations Lab

**Sai CRUD Operations Lab** is a hands-on web application that visually teaches how data moves from a dynamic form in the browser to a database and back again.

**Live app:** https://sai-crudop.lovable.app

The project is intentionally built as a learning-oriented CRUD lab: the interface shows the generated fields, generated form/table, CRUD operation, SQL representation, payload, and the browser-to-database flow.

## What you can do

### 1. Design fields

The Field Designer lets you build the shape of a record before using it.

Supported field types:

- `text`
- `number`
- `date`
- `boolean`

You can also:

- add fields from the built-in field library
- create custom fields
- choose whether a field appears in the form
- choose whether a field appears in the table
- add validation rules such as required, minimum/maximum value or length, and text regex patterns

### 2. Insert

The generated form collects the configured fields and converts the values into a JSON object.

The project stores that object in the `demo_items.data` JSONB column. The selected text field is also used as the row `name`.

The UI displays the SQL representation of the operation, for example:

```sql
insert into demo_items (name, data)
values (..., '...'::jsonb);
```

### 3. Read / Fetch

**Fetch from DB** reads rows from `demo_items`.

For the fields visible in the table, the application builds SQL expressions that read values from JSONB:

```sql
select id,
       data->>'field_name' as field_name
from demo_items
order by created_at desc;
```

### 4. Update

A row can be edited from the generated table.

The application updates the selected row using its `id` and writes the updated JSON object back to `demo_items`.

```sql
update demo_items
set name = ...,
    data = '...'::jsonb
where id = '...';
```

### 5. Delete

The delete action removes the selected row using its database ID:

```sql
delete from demo_items
where id = '...';
```

## Visual data flow

The application shows a four-stage pipeline:

```text
1. Dynamic Form
        |
        v
2. React App Code
   values -> JSON object
        |
        v
3. Cloud API
   database request
        |
        v
4. demo_items table
   JSONB data
```

The flow panel and activity log update as Insert, Fetch, Update, and Delete operations run.

## Database design

The project uses **Supabase/PostgreSQL**.

The main table is:

```text
demo_items
├── id
├── name
├── created_at
└── data (jsonb)
```

The repository migrations create `demo_items` and add the `data` JSONB column used for dynamic fields.

## Validation

Validation is generated from the current field definition.

Depending on the selected field type, the lab can enforce:

- required fields
- minimum/maximum numeric values
- minimum/maximum lengths
- regular-expression patterns for text

Validation errors are shown beside the affected control.

## Architecture

| Area | Implementation |
|---|---|
| UI | React + TypeScript |
| App framework | TanStack Start |
| Styling | Tailwind CSS |
| Components | shadcn/Radix UI |
| Data fetching/caching | TanStack React Query |
| Backend database | Supabase PostgreSQL |
| Flexible row data | PostgreSQL `jsonb` |

## Key files

| File | Responsibility |
|---|---|
| `src/routes/index.tsx` | CRUD orchestration, React Query mutations, SQL text and flow state |
| `src/components/crud-lab/FieldDesigner.tsx` | Field creation, visibility and validation rules |
| `src/components/crud-lab/DynamicForm.tsx` | Dynamic form rendering |
| `src/components/crud-lab/DynamicTable.tsx` | Dynamic table, row editing and deletion |
| `src/components/crud-lab/FlowPipeline.tsx` | Browser-to-database visual flow |
| `src/components/crud-lab/SqlBlock.tsx` | SQL syntax highlighting and clause explanations |
| `src/components/crud-lab/schema.ts` | Field types and validation helpers |
| `src/integrations/supabase/client.ts` | Supabase client |
| `supabase/migrations/` | Database schema changes |

## Run locally

```bash
git clone https://github.com/pallasivasai/sai-crudop.git
cd sai-crudop
npm install
npm run dev
```

## Why this project exists

The application is designed to make database concepts visible:

- how form fields become application state
- how React state becomes a JSON payload
- how CRUD requests reach the database
- how JSONB can store dynamic fields
- how SQL maps to Insert / Read / Update / Delete
- how field-level validation can be generated dynamically

## Links

- [Live App](https://sai-crudop.lovable.app)
- [GitHub Repository](https://github.com/pallasivasai/sai-crudop)
