import assert from "node:assert/strict";
import test from "node:test";
import { getSafeRedirectPath } from "./auth-redirect.ts";

test("keeps valid local paths, including their query string", () => {
  assert.equal(getSafeRedirectPath("/dashboard/theme?tab=colors"), "/dashboard/theme?tab=colors");
});

test("falls back for external or malformed redirect targets", () => {
  assert.equal(getSafeRedirectPath("https://example.com"), "/dashboard");
  assert.equal(getSafeRedirectPath("//example.com"), "/dashboard");
  assert.equal(getSafeRedirectPath("/\\\\example.com"), "/dashboard");
  assert.equal(getSafeRedirectPath(null), "/dashboard");
});
