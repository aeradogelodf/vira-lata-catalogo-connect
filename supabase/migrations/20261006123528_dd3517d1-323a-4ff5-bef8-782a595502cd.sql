ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS extra_links jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.store_settings SET extra_links = (
  SELECT coalesce(jsonb_agg(l), '[]'::jsonb) FROM (
    SELECT jsonb_build_object('label','Site','url',website_url) l WHERE website_url IS NOT NULL AND btrim(website_url) <> ''
    UNION ALL SELECT jsonb_build_object('label','TikTok','url',tiktok_url) WHERE tiktok_url IS NOT NULL AND btrim(tiktok_url) <> ''
    UNION ALL SELECT jsonb_build_object('label','Outro link','url',other_social_url) WHERE other_social_url IS NOT NULL AND btrim(other_social_url) <> ''
  ) s
) WHERE extra_links = '[]'::jsonb;
ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_extra_links_array CHECK (jsonb_typeof(extra_links) = 'array' AND jsonb_array_length(extra_links) <= 20);