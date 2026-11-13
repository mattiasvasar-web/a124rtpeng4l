CREATE TABLE public.custom_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  description text NOT NULL,
  budget text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Uus',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_orders TO authenticated;
GRANT INSERT ON public.custom_orders TO anon;
GRANT ALL ON public.custom_orders TO service_role;

ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit custom order" ON public.custom_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "own or admin read custom orders" ON public.custom_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin update custom orders" ON public.custom_orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin delete custom orders" ON public.custom_orders
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));