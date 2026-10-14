import assert from "node:assert/strict";
import test from "node:test";
import { handleToUrl, normalizeHandle, urlToHandle } from "./handles.ts";

test("builds canonical profile URLs from @handles", () => {
  assert.equal(handleToUrl("instagram", "@mauricio.otk"), "https://instagram.com/mauricio.otk");
  assert.equal(handleToUrl("tiktok", "MauricioOtk"), "https://www.tiktok.com/@mauriciootk");
});

test("accepts pasted profile URLs and extracts the handle", () => {
  assert.equal(normalizeHandle("instagram", "https://www.instagram.com/mauriciootk/?hl=pt"), "mauriciootk");
  assert.equal(normalizeHandle("tiktok", "https://www.tiktok.com/@mauriciootk?lang=pt"), "mauriciootk");
  assert.equal(urlToHandle("tiktok", "https://m.tiktok.com/@a_b.c"), "a_b.c");
});

test("rejects invalid handles and foreign hosts", () => {
  assert.equal(normalizeHandle("instagram", ""), null);
  assert.equal(normalizeHandle("instagram", "bad handle"), null);
  assert.equal(normalizeHandle("instagram", "ends.with."), null);
  assert.equal(normalizeHandle("instagram", "javascript:alert(1)"), null);
  assert.equal(normalizeHandle("tiktok", "a".repeat(25)), null);
  assert.equal(urlToHandle("instagram", "https://evil.com/mauriciootk"), null);
  assert.equal(urlToHandle("instagram", "not a url"), null);
});
