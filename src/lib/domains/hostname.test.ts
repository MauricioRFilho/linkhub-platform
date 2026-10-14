import assert from "node:assert/strict";
import test from "node:test";
import {
  hostFromHeader,
  isPlatformHost,
  normalizeHostname,
  parsePlatformHosts,
  validateHostname,
} from "./hostname.ts";

test("normalizes user input to the stored apex form", () => {
  // Arrange
  const inputs = ["https://WWW.MauricioOtk.com.br/links?x=1", "mauriciootk.com.br.", "  www.mauriciootk.com.br:443 "];
  // Act
  const results = inputs.map(normalizeHostname);
  // Assert
  assert.deepEqual(results, ["mauriciootk.com.br", "mauriciootk.com.br", "mauriciootk.com.br"]);
});

test("converts unicode domains to punycode and rejects garbage", () => {
  assert.equal(normalizeHostname("café.com.br"), "xn--caf-dma.com.br");
  assert.equal(normalizeHostname(""), "");
  assert.equal(normalizeHostname("http://"), "");
});

test("validates format and blocks platform-owned roots", () => {
  assert.equal(validateHostname("mauriciootk.com.br"), null);
  assert.equal(validateHostname("links.mauriciootk.com.br"), null);
  assert.match(validateHostname("") ?? "", /Informe/);
  assert.match(validateHostname("nodot") ?? "", /inválido/);
  assert.match(validateHostname("192.168.0.1") ?? "", /inválido/);
  assert.match(validateHostname("links.cadencecode.com.br") ?? "", /plataforma/);
  assert.match(validateHostname("evil.vercel.app") ?? "", /plataforma/);
  assert.match(validateHostname("localhost") ?? "", /inválido|plataforma/);
});

test("does not block lookalike roots that merely end with a platform name", () => {
  assert.equal(validateHostname("notcadencecode.com.br"), null);
});

test("detects platform hosts including wildcard entries", () => {
  // Arrange
  const hosts = parsePlatformHosts("links.cadencecode.com.br, localhost, *.vercel.app");
  // Act + Assert
  assert.equal(isPlatformHost("links.cadencecode.com.br", hosts), true);
  assert.equal(isPlatformHost("linkhub-git-main.vercel.app", hosts), true);
  assert.equal(isPlatformHost("localhost", hosts), true);
  assert.equal(isPlatformHost("mauriciootk.com.br", hosts), false);
  assert.equal(isPlatformHost("vercel.app.evil.com", hosts), false);
  assert.equal(isPlatformHost("", hosts), true);
});

test("falls back to defaults when env is empty and strips ports from Host", () => {
  assert.ok(parsePlatformHosts(undefined).includes("links.cadencecode.com.br"));
  assert.equal(hostFromHeader("LocalHost:3000"), "localhost");
  assert.equal(hostFromHeader(null), "");
});
