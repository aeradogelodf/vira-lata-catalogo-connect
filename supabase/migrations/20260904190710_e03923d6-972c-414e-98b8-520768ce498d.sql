CREATE TABLE public.pet_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_sizes_name_unique UNIQUE (name),
  CONSTRAINT pet_sizes_slug_unique UNIQUE (slug)
);

GRANT SELECT ON public.pet_sizes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_sizes TO authenticated;
GRANT ALL ON public.pet_sizes TO service_role;

ALTER TABLE public.pet_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portes ativos sao publicos" ON public.pet_sizes
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Admin gerencia portes" ON public.pet_sizes
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER pet_sizes_set_updated_at
  BEFORE UPDATE ON public.pet_sizes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES public.pet_sizes(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  duration_minutes integer NOT NULL,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_pricing_unique_combo UNIQUE (service_id, size_id),
  CONSTRAINT service_pricing_price_positive CHECK (price >= 0 AND price <= 999999),
  CONSTRAINT service_pricing_duration_valid CHECK (duration_minutes >= 1 AND duration_minutes <= 1440)
);

CREATE INDEX service_pricing_service_idx ON public.service_pricing (service_id);
CREATE INDEX service_pricing_size_idx ON public.service_pricing (size_id);

GRANT SELECT ON public.service_pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_pricing TO authenticated;
GRANT ALL ON public.service_pricing TO service_role;

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Precos ativos de servicos ativos sao publicos" ON public.service_pricing
  FOR SELECT TO anon, authenticated USING (
    active = true
    AND EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_pricing.service_id AND s.active = true)
    AND EXISTS (SELECT 1 FROM public.pet_sizes ps WHERE ps.id = service_pricing.size_id AND ps.active = true)
  );

CREATE POLICY "Admin gerencia precos de servicos" ON public.service_pricing
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER service_pricing_set_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();