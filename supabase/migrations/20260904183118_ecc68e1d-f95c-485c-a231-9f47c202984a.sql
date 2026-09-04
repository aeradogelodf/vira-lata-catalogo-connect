-- Restrict public access to store_settings to an explicit public view
drop policy if exists "Configuracoes publicas da loja" on public.store_settings;

revoke all on public.store_settings from anon;

create or replace view public.store_settings_public
with (security_invoker = off) as
select
  name, trade_name, segment, short_description, long_description,
  whatsapp_e164, whatsapp_display, phone, email,
  street, number, complement, district, city, state, postal_code, country,
  opening_hours,
  instagram_url, facebook_url, tiktok_url, website_url, other_social_url,
  hide_out_of_stock, updated_at
from public.store_settings;

grant select on public.store_settings_public to anon, authenticated;

-- Authenticated admins keep full table access via the existing admin policy
create policy "Admins leem configuracoes" on public.store_settings
for select to authenticated using (public.is_admin());