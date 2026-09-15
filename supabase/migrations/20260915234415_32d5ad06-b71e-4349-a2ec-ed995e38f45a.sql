DROP POLICY IF EXISTS "Configuracoes publicas da loja" ON public.store_settings;

REVOKE ALL ON public.store_settings FROM anon;

CREATE OR REPLACE VIEW public.store_settings_public
WITH (security_invoker = off) AS
SELECT
  name,
  trade_name,
  segment,
  short_description,
  long_description,
  whatsapp_e164,
  whatsapp_display,
  phone,
  email,
  street,
  number,
  complement,
  district,
  city,
  state,
  postal_code,
  country,
  opening_hours,
  instagram_url,
  facebook_url,
  tiktok_url,
  website_url,
  other_social_url,
  hide_out_of_stock,
  updated_at
FROM public.store_settings;

REVOKE ALL ON public.store_settings_public FROM PUBLIC;
GRANT SELECT ON public.store_settings_public TO anon, authenticated;