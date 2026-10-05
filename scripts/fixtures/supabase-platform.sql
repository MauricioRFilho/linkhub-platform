-- Minimal platform fixture; HTTP Auth/Storage are not emulated.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, public BOOLEAN,
 file_size_limit BIGINT, allowed_mime_types TEXT[]
);
CREATE TABLE storage.objects (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 bucket_id TEXT REFERENCES storage.buckets(id), name TEXT NOT NULL
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[]
LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY[split_part(name, '/', 1)]; $$;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
