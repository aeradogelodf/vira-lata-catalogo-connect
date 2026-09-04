drop view if exists public.store_settings_public;

create or replace function public.get_public_store_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'name', s.name,
    'trade_name', s.trade_name,
    'segment', s.segment,
    'short_description', s.short_description,
    'long_description', s.long_description,
    'whatsapp_e164', s.whatsapp_e164,
    'whatsapp_display', s.whatsapp_display,
    'phone', s.phone,
    'email', s.email,
    'street', s.street,
    'number', s.number,
    'complement', s.complement,
    'district', s.district,
    'city', s.city,
    'state', s.state,
    'postal_code', s.postal_code,
    'country', s.country,
    'opening_hours', s.opening_hours,
    'instagram_url', s.instagram_url,
    'facebook_url', s.facebook_url,
    'tiktok_url', s.tiktok_url,
    'website_url', s.website_url,
    'other_social_url', s.other_social_url,
    'hide_out_of_stock', s.hide_out_of_stock,
    'updated_at', s.updated_at
  )
  from public.store_settings s
  limit 1
$$;

revoke all on function public.get_public_store_settings() from public;
grant execute on function public.get_public_store_settings() to anon, authenticated;