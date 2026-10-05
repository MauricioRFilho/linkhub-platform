import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";

const name = `linkhub-migration-test-${process.pid}-${Date.now()}`;
function docker(args, input) {
  const result = spawnSync("docker", args, { input, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
let started = false;
try {
  docker(["run", "--rm", "-d", "--name", name, "-e", "POSTGRES_PASSWORD=local-migration-test", "postgres:17-alpine"]);
  started = true;
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const check = spawnSync("docker", ["exec", name, "pg_isready", "-U", "postgres"], { encoding: "utf8" });
    if (check.status === 0) { ready = true; break; }
    await setTimeout(500);
  }
  if (!ready) throw new Error("Test PostgreSQL did not become ready.");
  for (const path of [
    "scripts/fixtures/supabase-platform.sql",
    "supabase/migrations/20261002120000_initial_schema.sql",
    "supabase/migrations/20261002130000_add_editorial_theme.sql",
    "supabase/tests/initial_schema.sql",
  ]) {
    docker(["exec", "-i", name, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"], readFileSync(path, "utf8"));
  }
  console.log("PASS: migration, RLS, grants, onboarding defaults, reserved names, avatars and cascades.");
} finally {
  if (started) docker(["stop", name]);
}
