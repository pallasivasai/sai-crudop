CREATE TABLE public.demo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_items TO authenticated;
GRANT ALL ON public.demo_items TO service_role;

ALTER TABLE public.demo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view demo items" ON public.demo_items FOR SELECT USING (true);
CREATE POLICY "Anyone can add demo items" ON public.demo_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update demo items" ON public.demo_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete demo items" ON public.demo_items FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_demo_items_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER demo_items_updated_at BEFORE UPDATE ON public.demo_items
FOR EACH ROW EXECUTE FUNCTION public.set_demo_items_updated_at();

INSERT INTO public.demo_items (name, note) VALUES
  ('First item', 'Ee row database lo undi — SELECT tho fetch chesam'),
  ('Second item', 'Edit or delete chesi CRUD flow chudandi');