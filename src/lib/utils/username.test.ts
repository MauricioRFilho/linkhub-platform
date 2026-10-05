import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsername, validateUsername } from "./username.ts";

test("normalizes spaces and case for public usernames", () => {
  assert.equal(normalizeUsername("  Ana Silva  "), "ana-silva");
  assert.equal(validateUsername(normalizeUsername("Ana Silva")), null);
});

test("rejects reserved names and invalid formats", () => {
  assert.match(validateUsername("dashboard") ?? "", /não está disponível/);
  assert.match(validateUsername("bad name") ?? "", /letras minúsculas/);
  assert.match(validateUsername("ab") ?? "", /pelo menos 3/);
});
