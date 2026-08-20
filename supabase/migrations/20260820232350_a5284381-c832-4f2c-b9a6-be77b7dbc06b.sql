-- Substitui o uso da função SECURITY DEFINER nas políticas por uma função SECURITY INVOKER.
DROP POLICY IF EXISTS "Admin gerencia marcas" ON public.brands;
CREATE POLICY "Admin gerencia marcas" ON public.brands FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin gerencia categorias" ON public.categories;
CREATE POLICY "Admin gerencia categorias" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin gerencia produtos" ON public.products;
CREATE POLICY "Admin gerencia produtos" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin gerencia imagens" ON public.product_images;
CREATE POLICY "Admin gerencia imagens" ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_roles: apenas leitura dos próprios papéis; gestão fica com o service_role.
DROP POLICY IF EXISTS "Admin gerencia papeis" ON public.user_roles;

DROP POLICY IF EXISTS "Admin envia imagens de produtos" ON storage.objects;
CREATE POLICY "Admin envia imagens de produtos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin atualiza imagens de produtos" ON storage.objects;
CREATE POLICY "Admin atualiza imagens de produtos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin remove imagens de produtos" ON storage.objects;
CREATE POLICY "Admin remove imagens de produtos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());