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
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222');
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT pg_temp.expect_error($$INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'admin','Owner')$$,'23514');
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'owner-one','Owner One');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.themes WHERE profile_id=auth.uid()),'default theme');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.meta WHERE profile_id=auth.uid()),'default meta');
UPDATE public.themes SET template='editorial' WHERE profile_id=auth.uid();
SELECT pg_temp.assert_true((SELECT template='editorial' FROM public.themes WHERE profile_id=auth.uid()),'editorial theme template');
SELECT pg_temp.expect_error($$UPDATE public.themes SET template='unknown' WHERE profile_id=auth.uid()$$,'23514');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET verified=true WHERE id=auth.uid()$$,'42501');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET username='login' WHERE id=auth.uid()$$,'23514');
SELECT pg_temp.expect_error($$UPDATE public.profiles SET username='BAD USER' WHERE id=auth.uid()$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.reserved_usernames VALUES('custom')$$,'42501');
SELECT pg_temp.expect_error($$INSERT INTO public.profiles(id,username,display_name) VALUES('22222222-2222-2222-2222-222222222222','foreign-user','Other')$$,'42501');
INSERT INTO public.sections(profile_id,type,title) VALUES(auth.uid(),'link','Owner section');
INSERT INTO public.socials(profile_id,platform,url) VALUES(auth.uid(),'github','https://github.com/example');
INSERT INTO storage.objects(bucket_id,name) VALUES('avatars',auth.uid()::text || '/avatar.png');
SELECT pg_temp.expect_error($$INSERT INTO storage.objects(bucket_id,name) VALUES('avatars','22222222-2222-2222-2222-222222222222/avatar.png')$$,'42501');
UPDATE public.profiles SET display_name='Renamed' WHERE id=auth.uid();
SELECT pg_temp.assert_true((SELECT display_name='Renamed' AND verified=false FROM public.profiles WHERE id=auth.uid()),'owner edit');
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'owner-two','Owner Two');
WITH changed AS (UPDATE public.sections SET title='Hijacked' WHERE profile_id='11111111-1111-1111-1111-111111111111' RETURNING *)
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM changed),'cross tenant update');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title) VALUES('11111111-1111-1111-1111-111111111111','link','Foreign')$$,'42501');
INSERT INTO public.sections(profile_id,type,title) VALUES(auth.uid(),'link','Second');
SELECT pg_temp.expect_error($$UPDATE public.sections SET profile_id='11111111-1111-1111-1111-111111111111' WHERE profile_id=auth.uid()$$,'42501');
SET ROLE anon;
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.profiles),'public read');
SELECT pg_temp.assert_true((SELECT count(*)=30 FROM public.reserved_usernames),'reserved read');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title) VALUES('11111111-1111-1111-1111-111111111111','link','Anonymous')$$,'42501');
RESET ROLE;
SELECT pg_temp.assert_true((SELECT public AND file_size_limit=2097152 FROM storage.buckets WHERE id='avatars'),'avatar bucket');
SELECT pg_temp.assert_true((SELECT count(*)=6 FROM pg_tables WHERE schemaname='public' AND rowsecurity),'all tables RLS');
DELETE FROM auth.users WHERE id='11111111-1111-1111-1111-111111111111';
SELECT pg_temp.assert_true(NOT EXISTS(SELECT FROM public.profiles WHERE id='11111111-1111-1111-1111-111111111111')
 AND NOT EXISTS(SELECT FROM public.themes WHERE profile_id='11111111-1111-1111-1111-111111111111')
 AND NOT EXISTS(SELECT FROM public.meta WHERE profile_id='11111111-1111-1111-1111-111111111111')
 AND NOT EXISTS(SELECT FROM public.sections WHERE profile_id='11111111-1111-1111-1111-111111111111')
 AND NOT EXISTS(SELECT FROM public.socials WHERE profile_id='11111111-1111-1111-1111-111111111111'),'auth user cascade');
ROLLBACK;
