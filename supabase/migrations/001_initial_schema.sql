-- ============================================================
-- LinkHub Platform — Initial Schema
-- Multi-tenant link-in-bio with RLS
-- ============================================================

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'),
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Socials
CREATE TABLE socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  UNIQUE(profile_id, platform)
);

-- 3. Themes
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accent_color TEXT DEFAULT '#10b981',
  style TEXT DEFAULT 'dark' CHECK (style IN ('dark', 'light')),
  template TEXT DEFAULT 'classic' CHECK (template IN ('classic', 'minimal', 'bold', 'neon')),
  custom_css TEXT
);

-- 4. Sections (links, headers, products)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link', 'header', 'product')),
  title TEXT NOT NULL,
  subtitle TEXT,
  url TEXT,
  emoji TEXT,
  thumbnail_url TEXT,
  store TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Meta (SEO per profile)
CREATE TABLE meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  og_image_url TEXT,
  lang TEXT DEFAULT 'pt-BR'
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_sections_profile_order ON sections(profile_id, sort_order);
CREATE INDEX idx_socials_profile_order ON socials(profile_id, sort_order);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Socials: public read, owner CUD
CREATE POLICY "Anyone can view socials"
  ON socials FOR SELECT USING (true);

CREATE POLICY "Users can manage own socials"
  ON socials FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own socials"
  ON socials FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own socials"
  ON socials FOR DELETE USING (profile_id = auth.uid());

-- Themes: public read, owner CUD
CREATE POLICY "Anyone can view themes"
  ON themes FOR SELECT USING (true);

CREATE POLICY "Users can manage own theme"
  ON themes FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own theme"
  ON themes FOR UPDATE USING (profile_id = auth.uid());

-- Sections: public read, owner CUD
CREATE POLICY "Anyone can view sections"
  ON sections FOR SELECT USING (true);

CREATE POLICY "Users can manage own sections"
  ON sections FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own sections"
  ON sections FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own sections"
  ON sections FOR DELETE USING (profile_id = auth.uid());

-- Meta: public read, owner CUD
CREATE POLICY "Anyone can view meta"
  ON meta FOR SELECT USING (true);

CREATE POLICY "Users can manage own meta"
  ON meta FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own meta"
  ON meta FOR UPDATE USING (profile_id = auth.uid());

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
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Function: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Reserved usernames
-- ============================================================

CREATE TABLE reserved_usernames (
  username TEXT PRIMARY KEY
);

INSERT INTO reserved_usernames (username) VALUES
  ('admin'), ('api'), ('app'), ('auth'), ('billing'),
  ('blog'), ('callback'), ('cdn'), ('dashboard'), ('docs'),
  ('help'), ('login'), ('logout'), ('register'), ('settings'),
  ('signup'), ('status'), ('support'), ('terms'), ('privacy'),
  ('about'), ('contact'), ('pricing'), ('legal'), ('null'),
  ('undefined'), ('root'), ('system'), ('www'), ('mail');
