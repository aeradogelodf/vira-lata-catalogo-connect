CREATE TYPE public.banner_link_type AS ENUM ('none','catalog','product','service','whatsapp','external');

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  alt_text text,
  cta_label text,
  link_type public.banner_link_type NOT NULL DEFAULT 'none',
  link_value text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners ativos sao publicos" ON public.banners
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "Admin gerencia banners" ON public.banners
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER banners_set_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY "Imagens de itens ativos sao publicas" ON storage.objects;

CREATE POLICY "Imagens de itens ativos sao publicas" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images' AND (
      EXISTS (SELECT 1 FROM public.product_images pi JOIN public.products p ON p.id = pi.product_id WHERE pi.image_url = storage.objects.name AND p.active = true)
      OR EXISTS (SELECT 1 FROM public.products p WHERE p.image_url = storage.objects.name AND p.active = true)
      OR EXISTS (SELECT 1 FROM public.services s WHERE s.image_url = storage.objects.name AND s.active = true)
      OR EXISTS (SELECT 1 FROM public.banners b WHERE b.image_url = storage.objects.name AND b.active = true)
    )
  );