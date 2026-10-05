BEGIN;

-- ============================================================
-- LinkHub Platform — Initial Schema
-- Multi-tenant link-in-bio with RLS
-- ============================================================

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'),
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Socials
CREATE TABLE public.socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(profile_id, platform)
);

-- 3. Themes
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accent_color TEXT NOT NULL DEFAULT '#10b981',
  style TEXT NOT NULL DEFAULT 'dark' CHECK (style IN ('dark', 'light')),
  template TEXT NOT NULL DEFAULT 'classic' CHECK (template IN ('classic', 'minimal', 'bold', 'neon')),
  custom_css TEXT
);

-- 4. Sections (links, headers, products)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link', 'header', 'product')),
  title TEXT NOT NULL,
  subtitle TEXT,
  url TEXT,
  emoji TEXT,
  thumbnail_url TEXT,
  store TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Meta (SEO per profile)
CREATE TABLE public.meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  og_image_url TEXT,
  lang TEXT NOT NULL DEFAULT 'pt-BR'
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_sections_profile_order ON public.sections(profile_id, sort_order);
CREATE INDEX idx_socials_profile_order ON public.socials(profile_id, sort_order);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Socials: public read, owner CUD
CREATE POLICY "Anyone can view socials"
  ON public.socials FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can manage own socials"
  ON public.socials FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own socials"
  ON public.socials FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own socials"
  ON public.socials FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Themes: public read, owner CUD
CREATE POLICY "Anyone can view themes"
  ON public.themes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can manage own theme"
  ON public.themes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own theme"
  ON public.themes FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Sections: public read, owner CUD
CREATE POLICY "Anyone can view sections"
  ON public.sections FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can manage own sections"
  ON public.sections FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own sections"
  ON public.sections FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own sections"
  ON public.sections FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Meta: public read, owner CUD
CREATE POLICY "Anyone can view meta"
  ON public.meta FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can manage own meta"
  ON public.meta FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own meta"
  ON public.meta FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- Storage bucket for avatars
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Function: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Reserved usernames
-- ============================================================

CREATE TABLE public.reserved_usernames (
  username TEXT PRIMARY KEY
);

INSERT INTO public.reserved_usernames (username) VALUES
  ('admin'), ('api'), ('app'), ('auth'), ('billing'),
  ('blog'), ('callback'), ('cdn'), ('dashboard'), ('docs'),
  ('help'), ('login'), ('logout'), ('register'), ('settings'),
  ('signup'), ('status'), ('support'), ('terms'), ('privacy'),
  ('about'), ('contact'), ('pricing'), ('legal'), ('null'),
  ('undefined'), ('root'), ('system'), ('www'), ('mail');


-- Reserved names are enforced in PostgreSQL, including direct API writes.
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reserved usernames"
  ON public.reserved_usernames FOR SELECT TO anon, authenticated USING (true);

CREATE FUNCTION public.validate_profile_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username = NEW.username) THEN
    RAISE EXCEPTION 'Username is reserved' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_validate_username
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_username();

-- Create dependent records atomically, after the profile exists.
CREATE FUNCTION public.initialize_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.themes (profile_id) VALUES (NEW.id);
  INSERT INTO public.meta (profile_id, title, description)
    VALUES (NEW.id, NEW.display_name || ' | Links', 'Links de ' || NEW.display_name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_initialize
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_profile();

REVOKE ALL ON FUNCTION public.initialize_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_profile_username() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Explicit grants: public readers cannot write, owners cannot self-verify.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON TABLE public.profiles, public.socials, public.themes,
  public.sections, public.meta, public.reserved_usernames FROM anon, authenticated;
GRANT SELECT ON TABLE public.profiles, public.socials, public.themes,
  public.sections, public.meta, public.reserved_usernames TO anon, authenticated;
GRANT INSERT (id, username, display_name, bio, avatar_url)
  ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url)
  ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.socials, public.sections TO authenticated;
GRANT INSERT, UPDATE ON public.themes, public.meta TO authenticated;
GRANT ALL ON TABLE public.profiles, public.socials, public.themes,
  public.sections, public.meta, public.reserved_usernames TO service_role;

COMMIT;
