-- 1) Storage: leitura pública restrita a imagens de produtos/serviços ativos
DROP POLICY IF EXISTS "Imagens de produtos com leitura publica" ON storage.objects;

CREATE POLICY "Imagens de itens ativos sao publicas"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.product_images pi
      JOIN public.products p ON p.id = pi.product_id
      WHERE pi.image_url = storage.objects.name AND p.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.image_url = storage.objects.name AND p.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.image_url = storage.objects.name AND s.active = true
    )
  )
);

DROP POLICY IF EXISTS "Admin le imagens de produtos" ON storage.objects;
CREATE POLICY "Admin le imagens de produtos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());

-- 2) store_settings: expor apenas colunas públicas por meio de uma view
DROP POLICY IF EXISTS "Configuracoes da loja sao publicas" ON public.store_settings;

CREATE OR REPLACE VIEW public.store_settings_public AS
SELECT
  name, trade_name, segment, short_description, long_description,
  whatsapp_e164, whatsapp_display, phone, email,
  street, number, complement, district, city, state, postal_code, country,
  opening_hours, instagram_url, facebook_url, tiktok_url, website_url, other_social_url,
  hide_out_of_stock, updated_at
FROM public.store_settings;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;
