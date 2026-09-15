DROP VIEW IF EXISTS public.store_settings_public;
DROP POLICY IF EXISTS "Configuracoes publicas da loja" ON public.store_settings;
REVOKE ALL ON public.store_settings FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_store_settings()
RETURNS TABLE (
  name text,
  trade_name text,
  segment text,
  short_description text,
  long_description text,
  whatsapp_e164 text,
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
  country text,
  opening_hours jsonb,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  website_url text,
  other_social_url text,
  hide_out_of_stock boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.name,
    s.trade_name,
    s.segment,
    s.short_description,
    s.long_description,
    s.whatsapp_e164,
    s.whatsapp_display,
    s.phone,
    s.email,
    s.street,
    s.number,
    s.complement,
    s.district,
    s.city,
    s.state,
    s.postal_code,
    s.country,
    s.opening_hours,
    s.instagram_url,
    s.facebook_url,
    s.tiktok_url,
    s.website_url,
    s.other_social_url,
    s.hide_out_of_stock,
    s.updated_at
  FROM public.store_settings AS s
  WHERE s.singleton = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_store_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_settings() TO anon, authenticated;