BEGIN;
CREATE FUNCTION pg_temp.assert_true(ok BOOLEAN, label TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
 IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
END; $$;
CREATE FUNCTION pg_temp.expect_error(statement TEXT, code TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = code THEN RETURN; END IF;
  RAISE;
 END;
 RAISE EXCEPTION 'Expected SQLSTATE % for %', code, statement;
END; $$;

INSERT INTO auth.users VALUES
 ('55555555-5555-5555-5555-555555555555'),
 ('66666666-6666-6666-6666-666666666666');

SET ROLE authenticated;

-- Social-handle usernames
SET request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'other.tenant','Other');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET username='bad..dots' WHERE id=auth.uid()$$,'23514');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET username='.leading' WHERE id=auth.uid()$$,'23514');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET username='trailing.' WHERE id=auth.uid()$$,'23514');

SET request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'domain.owner','Owner');

-- Owner adds a domain; cannot self-activate or forge the token
INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'owner.com.br');
SELECT pg_temp.assert_true((SELECT status='pending' AND length(verification_token)=32 FROM public.custom_domains),'starts pending with token');
SELECT pg_temp.expect_error($$UPDATE public.custom_domains SET status='active'$$,'42501');
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname,status) VALUES(auth.uid(),'x.com','active')$$,'42501');
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'second.com')$$,'23505');

-- Format guards
SET request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'www.other.com')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'Upper.COM')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'nodot')$$,'23514');

-- Cross-tenant: cannot claim for others, read or delete another tenant's domain
SELECT pg_temp.expect_error($$INSERT INTO public.custom_domains(profile_id,hostname) VALUES('55555555-5555-5555-5555-555555555555','evil.com')$$,'42501');
-- Anti-squatting: a competing PENDING claim is allowed (it cannot block the real owner)
INSERT INTO public.custom_domains(profile_id,hostname) VALUES(auth.uid(),'owner.com.br');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.custom_domains),'other tenant sees only own claim');
DELETE FROM public.custom_domains WHERE profile_id='55555555-5555-5555-5555-555555555555';
RESET ROLE;
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.custom_domains),'cross-tenant delete ignored');

-- Pending domains never resolve
SET ROLE anon;
SELECT pg_temp.assert_true(public.resolve_custom_domain('owner.com.br') IS NULL,'pending does not resolve');
SELECT pg_temp.expect_error($$SELECT * FROM public.custom_domains$$,'42501');

-- Server activates after DNS proof
SET ROLE service_role;
UPDATE public.custom_domains SET status='active', verified_at=now()
 WHERE hostname='owner.com.br' AND profile_id='55555555-5555-5555-5555-555555555555';
-- The squatter can never be verified for the same host
SELECT pg_temp.expect_error($$UPDATE public.custom_domains SET status='active' WHERE profile_id='66666666-6666-6666-6666-666666666666'$$,'23505');

SET ROLE anon;
SELECT pg_temp.assert_true(public.resolve_custom_domain('owner.com.br')='domain.owner','apex resolves');
SELECT pg_temp.assert_true(public.resolve_custom_domain('WWW.Owner.com.br')='domain.owner','www + case resolves');
SELECT pg_temp.assert_true(public.resolve_custom_domain('unknown.com') IS NULL,'unknown host');
SELECT pg_temp.assert_true(public.profile_custom_domain('55555555-5555-5555-5555-555555555555')='owner.com.br','canonical lookup');
RESET ROLE;

-- Cascade with profile
DELETE FROM public.profiles WHERE id='55555555-5555-5555-5555-555555555555';
SELECT pg_temp.assert_true(NOT EXISTS(SELECT FROM public.custom_domains WHERE profile_id='55555555-5555-5555-5555-555555555555'),'domain cascades with profile');
ROLLBACK;
