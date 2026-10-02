-- ============================================================
-- Seed: Mauricio's profile (migrated from data.json)
-- Run after creating your Supabase auth user
-- Replace 'YOUR_USER_UUID' with your actual auth.users.id
-- ============================================================

-- To get your UUID after first login:
-- SELECT id FROM auth.users WHERE email = 'your@email.com';

-- UNCOMMENT and replace UUID after first login:

/*
INSERT INTO profiles (id, username, display_name, bio, avatar_url, verified)
VALUES (
  'YOUR_USER_UUID',
  'mauriciootk',
  'Mauricio Rodrigues',
  'Engenheiro Fullstack Sênior & Atleta de Endurance',
  null,
  true
);

INSERT INTO socials (profile_id, platform, url, sort_order) VALUES
  ('YOUR_USER_UUID', 'github', 'https://github.com/MauricioRFilho', 0),
  ('YOUR_USER_UUID', 'linkedin', 'https://linkedin.com/in/mauricio-d-ba069ab3/', 1),
  ('YOUR_USER_UUID', 'instagram', 'https://instagram.com/mauriciootk/', 2),
  ('YOUR_USER_UUID', 'strava', 'https://strava.com/athletes/65971729', 3);

INSERT INTO themes (profile_id, accent_color, style, template)
VALUES ('YOUR_USER_UUID', '#10b981', 'dark', 'classic');

INSERT INTO meta (profile_id, title, description, lang)
VALUES (
  'YOUR_USER_UUID',
  'Mauricio Rodrigues | Links',
  'Links oficiais de Mauricio Rodrigues — Engenheiro Fullstack Sênior & Atleta de Endurance.',
  'pt-BR'
);

INSERT INTO sections (profile_id, type, title, subtitle, url, emoji, store, sort_order, active) VALUES
  ('YOUR_USER_UUID', 'link', 'Meu GitHub', 'Projetos open source & código', 'https://github.com/MauricioRFilho', '🧑‍💻', null, 0, true),
  ('YOUR_USER_UUID', 'link', 'Strava - Treinos & Corridas', 'Acompanhe minha rotina de endurance', 'https://strava.com/athletes/65971729', '🏃', null, 1, true),
  ('YOUR_USER_UUID', 'link', 'Contato & Parcerias', null, 'mailto:mauricio.srfh@gmail.com', '📩', null, 2, true),
  ('YOUR_USER_UUID', 'header', '🛒 Recomendações', null, null, null, null, 3, true),
  ('YOUR_USER_UUID', 'product', 'Meu Setup Completo', 'Tudo que uso no dia a dia', 'https://www.amazon.com.br/shop/mauriciootk/photo/amzn1.shoppablemedia.v1.caa3e863-581f-4994-af9d-b1b028c0794d', null, 'amazon', 4, true),
  ('YOUR_USER_UUID', 'product', 'Promoções Shopee', 'Ofertas selecionadas', 'https://shope.ee/30NkYeBSiB', null, 'shopee', 5, true);
*/
