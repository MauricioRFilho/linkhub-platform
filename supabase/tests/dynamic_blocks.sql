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
 ('33333333-3333-3333-3333-333333333333'),
 ('44444444-4444-4444-4444-444444444444');

SET ROLE authenticated;
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'other-owner','Other');
INSERT INTO public.sections(id,profile_id,type,title,layout)
 VALUES('aaaaaaaa-0000-0000-0000-000000000004',auth.uid(),'panel','Foreign panel','list');

SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
INSERT INTO public.profiles(id,username,display_name) VALUES(auth.uid(),'blocks-owner','Blocks');

-- Panels + children
INSERT INTO public.sections(id,profile_id,type,title,layout)
 VALUES('aaaaaaaa-0000-0000-0000-000000000001',auth.uid(),'panel','Achado da semana','spotlight');
INSERT INTO public.sections(id,profile_id,parent_id,type,title,config)
 VALUES('aaaaaaaa-0000-0000-0000-000000000002',auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001','coupon','Cupom','{"code":"X10"}');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title) VALUES(auth.uid(),'panel','No layout')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title,layout) VALUES(auth.uid(),'link','Bad layout','grid')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,parent_id,type,title) VALUES(auth.uid(),'aaaaaaaa-0000-0000-0000-000000000002','link','Child of coupon')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,parent_id,type,title,layout) VALUES(auth.uid(),'aaaaaaaa-0000-0000-0000-000000000001','panel','Nested','list')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,parent_id,type,title) VALUES(auth.uid(),'aaaaaaaa-0000-0000-0000-000000000004','link','Foreign parent')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title,config) VALUES(auth.uid(),'text','Array','[]')$$,'23514');
SELECT pg_temp.expect_error($$INSERT INTO public.sections(profile_id,type,title,starts_at,ends_at) VALUES(auth.uid(),'link','Window',now(),now() - interval '1 day')$$,'23514');

-- Scheduling / visibility
INSERT INTO public.sections(id,profile_id,type,title,active) VALUES('aaaaaaaa-0000-0000-0000-000000000010',auth.uid(),'link','Hidden',false);
INSERT INTO public.sections(id,profile_id,type,title,starts_at) VALUES('aaaaaaaa-0000-0000-0000-000000000011',auth.uid(),'coupon','Future',now() + interval '1 day');
INSERT INTO public.sections(id,profile_id,type,title,ends_at) VALUES('aaaaaaaa-0000-0000-0000-000000000012',auth.uid(),'coupon','Expired',now() - interval '1 second');
SELECT pg_temp.assert_true((SELECT count(*)=5 FROM public.sections WHERE profile_id=auth.uid()),'owner sees all own blocks');

SET ROLE anon;
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.sections WHERE profile_id='33333333-3333-3333-3333-333333333333'),'anon sees only published');
SELECT public.track_click('aaaaaaaa-0000-0000-0000-000000000002','copy','instagram.com','mobile');
SELECT pg_temp.expect_error($$SELECT public.track_click('aaaaaaaa-0000-0000-0000-000000000011','click',NULL,NULL)$$,'22023');
SELECT pg_temp.expect_error($$SELECT public.track_click('aaaaaaaa-0000-0000-0000-000000000010','click',NULL,NULL)$$,'22023');
SELECT pg_temp.expect_error($$SELECT * FROM public.section_clicks$$,'42501');
SELECT pg_temp.expect_error($$INSERT INTO public.section_clicks(section_id,profile_id) VALUES('aaaaaaaa-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333')$$,'42501');

SET ROLE authenticated;
SELECT pg_temp.assert_true((SELECT total=1 AND last_7d=1 FROM public.section_click_stats WHERE section_id='aaaaaaaa-0000-0000-0000-000000000002' AND kind='copy'),'owner reads stats');
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.section_clicks),'cross tenant clicks hidden');
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.sections WHERE id='aaaaaaaa-0000-0000-0000-000000000010'),'other user cannot see hidden');
RESET ROLE;

DELETE FROM public.sections WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
SELECT pg_temp.assert_true(NOT EXISTS(SELECT FROM public.sections WHERE id='aaaaaaaa-0000-0000-0000-000000000002')
 AND NOT EXISTS(SELECT FROM public.section_clicks WHERE section_id='aaaaaaaa-0000-0000-0000-000000000002'),'panel cascade');
ROLLBACK;
