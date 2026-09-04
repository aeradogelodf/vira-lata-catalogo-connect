drop function if exists public.get_public_store_settings();

-- Public reads go through a column-limited view running with the caller's own rights
create or replace view public.store_settings_public
with (security_invoker = on) as
select
  name, trade_name, segment, short_description, long_description,
  whatsapp_e164, whatsapp_display, phone, email,
  street, number, complement, district, city, state, postal_code, country,
  opening_hours,
  instagram_url, facebook_url, tiktok_url, website_url, other_social_url,
  hide_out_of_stock, updated_at
from public.store_settings;

grant select on public.store_settings_public to anon, authenticated;

-- Anonymous visitors may read only the public-facing columns of the table
grant select (
  name, trade_name, segment, short_description, long_description,
  whatsapp_e164, whatsapp_display, phone, email,
  street, number, complement, district, city, state, postal_code, country,
  opening_hours,
  instagram_url, facebook_url, tiktok_url, website_url, other_social_url,
  hide_out_of_stock, updated_at
) on public.store_settings to anon;

drop policy if exists "Configuracoes publicas da loja" on public.store_settings;
create policy "Configuracoes publicas da loja"
on public.store_settings for select to anon using (true);