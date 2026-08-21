CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  name text NOT NULL,
  trade_name text,
  segment text,
  short_description text,
  long_description text,
  whatsapp_e164 text NOT NULL,
  whatsapp_display text,
  phone text,
  email text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'BR',
  opening_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  website_url text,
  other_social_url text,
  hide_out_of_stock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_singleton_true CHECK (singleton = true)
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configuracoes da loja sao publicas"
  ON public.store_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin gerencia configuracoes"
  ON public.store_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER store_settings_set_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO public.store_settings (
  name, trade_name, segment, short_description,
  whatsapp_e164, whatsapp_display,
  street, district, city, state, postal_code, country,
  opening_hours
) VALUES (
  'Agropet Vira Lata',
  'Agropet Vira Lata',
  'Pet shop, agropecuária, produtos e serviços para animais',
  'Catálogo digital da Agropet Vira Lata: produtos e serviços para o seu animal, com atendimento pelo WhatsApp.',
  '556133997123',
  '(61) 3399-7123',
  'QN 7, Conjunto B, Setor Norte',
  'Ceilândia Sul',
  'Brasília',
  'DF',
  '72215-072',
  'BR',
  '[
    {"day":"seg","label":"Segunda","opensAt":"07:00","closesAt":"19:00"},
    {"day":"ter","label":"Terça","opensAt":"07:00","closesAt":"19:00"},
    {"day":"qua","label":"Quarta","opensAt":"07:00","closesAt":"19:00"},
    {"day":"qui","label":"Quinta","opensAt":"07:00","closesAt":"19:00"},
    {"day":"sex","label":"Sexta","opensAt":"07:00","closesAt":"19:00"},
    {"day":"sab","label":"Sábado","opensAt":"08:00","closesAt":"19:00"},
    {"day":"dom","label":"Domingo","opensAt":null,"closesAt":null}
  ]'::jsonb
);