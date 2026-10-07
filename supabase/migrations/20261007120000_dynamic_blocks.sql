BEGIN;

-- ============================================================
-- LinkHub — Dynamic blocks, panels, scheduling and click analytics
-- Why: creators must compose their page autonomously (affiliate
-- product + coupon + community links, valid "only this week").
-- @see context.md — "Personalização sem código"
-- ============================================================

-- 1. Sections become generic blocks
ALTER TABLE public.sections DROP CONSTRAINT IF EXISTS sections_type_check;

ALTER TABLE public.sections
  ADD COLUMN parent_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  ADD COLUMN layout TEXT,
  ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN starts_at TIMESTAMPTZ,
  ADD COLUMN ends_at TIMESTAMPTZ;

ALTER TABLE public.sections
  ADD CONSTRAINT sections_type_check CHECK (type IN
    ('link', 'header', 'product', 'panel', 'coupon', 'community', 'video', 'text')),
  ADD CONSTRAINT sections_layout_check CHECK (layout IN ('list', 'grid', 'carousel', 'spotlight')),
  ADD CONSTRAINT sections_panel_layout CHECK ((type = 'panel') = (layout IS NOT NULL)),
  ADD CONSTRAINT sections_config_object CHECK (
    jsonb_typeof(config) = 'object' AND pg_column_size(config) < 8192),
  ADD CONSTRAINT sections_schedule_window CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at),
  ADD CONSTRAINT sections_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id);

CREATE INDEX idx_sections_parent ON public.sections(parent_id, sort_order);

-- Panels are one level deep and only hold blocks of the same owner.
CREATE FUNCTION public.validate_section_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent public.sections%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.type IN ('panel', 'header') THEN
    RAISE EXCEPTION 'Panels and headers cannot be nested' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO parent FROM public.sections WHERE id = NEW.parent_id;
  IF NOT FOUND OR parent.type <> 'panel' OR parent.profile_id <> NEW.profile_id
     OR parent.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid parent panel' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sections_validate_parent
  BEFORE INSERT OR UPDATE OF parent_id, type, profile_id ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.validate_section_parent();

REVOKE ALL ON FUNCTION public.validate_section_parent() FROM PUBLIC, anon, authenticated;

-- 2. RLS fix: hidden/scheduled blocks were readable by anyone.
-- A coupon scheduled for next week must not leak through the API.
DROP POLICY "Anyone can view sections" ON public.sections;

CREATE POLICY "Public sees published sections"
  ON public.sections FOR SELECT TO anon, authenticated
  USING (
    active
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Owners see own sections"
  ON public.sections FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- 3. Anonymous click analytics (no IP, no cookies — LGPD-friendly)
CREATE TABLE public.section_clicks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'click' CHECK (kind IN ('click', 'copy')),
  referrer_host TEXT CHECK (char_length(referrer_host) <= 253),
  device TEXT CHECK (device IN ('mobile', 'desktop', 'tablet')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clicks_profile_time ON public.section_clicks(profile_id, created_at DESC);
CREATE INDEX idx_clicks_section ON public.section_clicks(section_id);

ALTER TABLE public.section_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own clicks"
  ON public.section_clicks FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Inserts only through this function: it derives profile_id and
-- refuses unpublished blocks, so visitors cannot forge stats.
CREATE FUNCTION public.track_click(
  p_section UUID, p_kind TEXT DEFAULT 'click',
  p_referrer TEXT DEFAULT NULL, p_device TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  owner UUID;
BEGIN
  SELECT s.profile_id INTO owner FROM public.sections s
  WHERE s.id = p_section AND s.active
    AND (s.starts_at IS NULL OR s.starts_at <= now())
    AND (s.ends_at IS NULL OR s.ends_at > now());
  IF owner IS NULL THEN
    RAISE EXCEPTION 'Section not published' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.section_clicks(section_id, profile_id, kind, referrer_host, device)
  VALUES (p_section, owner, p_kind, left(p_referrer, 253),
    CASE WHEN p_device IN ('mobile', 'desktop', 'tablet') THEN p_device END);
END;
$$;

REVOKE ALL ON FUNCTION public.track_click(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_click(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE VIEW public.section_click_stats WITH (security_invoker = true) AS
  SELECT section_id, profile_id, kind,
    count(*)::INT AS total,
    (count(*) FILTER (WHERE created_at > now() - interval '7 days'))::INT AS last_7d
  FROM public.section_clicks
  GROUP BY section_id, profile_id, kind;

REVOKE ALL ON TABLE public.section_clicks, public.section_click_stats FROM anon, authenticated;
GRANT SELECT ON TABLE public.section_clicks, public.section_click_stats TO authenticated;
GRANT ALL ON TABLE public.section_clicks, public.section_click_stats TO service_role;

COMMIT;
