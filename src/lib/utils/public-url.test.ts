import assert from "node:assert/strict";
import test from "node:test";
import { isSafeProfileLink, safeImageSource } from "./public-url.ts";

test("allows safe profile links and contact links", () => {
  assert.equal(isSafeProfileLink("https://example.com"), true);
  assert.equal(isSafeProfileLink("/portfolio"), true);
  assert.equal(isSafeProfileLink("mailto:hello@example.com", true), true);
  assert.equal(isSafeProfileLink("tel:+5511999999999", true), true);
  assert.equal(isSafeProfileLink("mailto:hello@example.com"), false);
});

test("rejects executable and protocol-relative profile links", () => {
  assert.equal(isSafeProfileLink("javascript:alert(1)", true), false);
  assert.equal(isSafeProfileLink("data:text/html,<script>alert(1)</script>", true), false);
  assert.equal(isSafeProfileLink("//example.com"), false);
  assert.equal(isSafeProfileLink("\\\\example.com"), false);
});

test("accepts only web URLs or local paths for profile images", () => {
  assert.equal(safeImageSource("https://cdn.example.com/avatar.png"), "https://cdn.example.com/avatar.png");
  assert.equal(safeImageSource("/avatar.png"), "/avatar.png");
  assert.equal(safeImageSource("javascript:alert(1)"), null);
  assert.equal(safeImageSource("data:image/png;base64,AA=="), null);
  assert.equal(safeImageSource("//cdn.example.com/avatar.png"), null);
});
