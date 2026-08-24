DROP VIEW IF EXISTS public.store_settings_public;

-- Leitura pública volta à tabela, porém limitada por privilégios de coluna:
-- colunas internas futuras não ficam expostas automaticamente.
CREATE POLICY "Configuracoes publicas da loja"
ON public.store_settings FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT ON public.store_settings FROM anon, authenticated;

GRANT SELECT (
  id, name, trade_name, segment, short_description, long_description,
  whatsapp_e164, whatsapp_display, phone, email,
  street, number, complement, district, city, state, postal_code, country,
  opening_hours, instagram_url, facebook_url, tiktok_url, website_url,
  other_social_url, hide_out_of_stock, created_at, updated_at
) ON public.store_settings TO anon, authenticated;
