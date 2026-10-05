BEGIN;

ALTER TABLE public.themes
  DROP CONSTRAINT IF EXISTS themes_template_check;

ALTER TABLE public.themes
  ADD CONSTRAINT themes_template_check
  CHECK (template IN ('classic', 'minimal', 'bold', 'neon', 'editorial'));

COMMIT;
