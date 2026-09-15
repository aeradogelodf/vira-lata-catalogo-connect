DROP FUNCTION IF EXISTS public.get_public_store_settings();
REVOKE ALL ON public.store_settings FROM anon;
DROP POLICY IF EXISTS "Configuracoes publicas da loja" ON public.store_settings;