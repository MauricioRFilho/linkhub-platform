BEGIN;

-- ============================================================
-- LinkHub — Custom domains per profile + social-handle usernames
-- @see docs/custom-domains.md
-- ============================================================

-- 1. Usernames compatible with Instagram/TikTok handles.
-- Why: creators want the platform @ to be identical to their social @,
-- and both networks allow dots (e.g. "mauricio.otk"). Consecutive dots are
-- rejected to avoid lookalike handles. Hyphen stays for backwards compat.
ALTER TABLE public.profiles DROP CONSTRAINT username_format;
ALTER TABLE public.profiles ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$' AND position('..' IN username) = 0);

-- With dots allowed, file-like names would collide with static routes.
INSERT INTO public.reserved_usernames (username) VALUES
  ('robots.txt'), ('sitemap.xml'), ('favicon.ico'), ('manifest.webmanifest'),
  ('manifest.json'), ('sw.js'), ('index.html'), ('ads.txt'), ('security.txt'),
  ('apple-touch-icon.png'), ('icon.png'), ('icon.svg')
ON CONFLICT DO NOTHING;

-- 2. Custom domains (one per profile for now).
-- `hostname` is always stored as the apex/registrable host WITHOUT "www.";
-- "www." is accepted at resolve time so both variants work.
CREATE TABLE public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL
    CONSTRAINT hostname_format CHECK (
      length(hostname) <= 253
      AND hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
      AND hostname NOT LIKE 'www.%'
    ),
  -- Ownership proof: user must publish TXT `_linkhub.<hostname>` = token.
  -- Prevents tenant B from claiming tenant A's domain before A points DNS.
  verification_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT custom_domain_status CHECK (status IN ('pending', 'active', 'misconfigured')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Anti-squatting: many tenants may hold a PENDING claim for the same host,
-- but only one can ever be verified. Whoever proves the TXT record wins.
CREATE UNIQUE INDEX custom_domains_verified_hostname
  ON public.custom_domains(hostname) WHERE status <> 'pending';
CREATE INDEX idx_custom_domains_hostname ON public.custom_domains(hostname);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own domain" ON public.custom_domains
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Owner adds own domain" ON public.custom_domains
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner removes own domain" ON public.custom_domains
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Status/verification are written ONLY by the server (service_role) after
-- DNS ownership is proven, so owners cannot self-activate.
REVOKE ALL ON TABLE public.custom_domains FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.custom_domains TO authenticated;
GRANT INSERT (profile_id, hostname) ON TABLE public.custom_domains TO authenticated;
GRANT ALL ON TABLE public.custom_domains TO service_role;

-- 3. Public resolvers — expose only ACTIVE mappings, nothing else.

-- Host -> username, used by the proxy for every custom-domain request.
CREATE FUNCTION public.resolve_custom_domain(p_hostname TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.username
  FROM public.custom_domains d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE d.status = 'active'
    AND d.hostname = regexp_replace(lower(p_hostname), '^www\.', '');
$$;

-- Profile -> active hostname, used for canonical URLs on public pages.
CREATE FUNCTION public.profile_custom_domain(p_profile UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT d.hostname FROM public.custom_domains d
  WHERE d.profile_id = p_profile AND d.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.resolve_custom_domain(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profile_custom_domain(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_custom_domain(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profile_custom_domain(UUID) TO anon, authenticated, service_role;

COMMIT;
