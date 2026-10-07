import assert from "node:assert/strict";
import test from "node:test";
import { parseVideoUrl, validateConfig, readConfig, validateBlockUrl } from "./config.ts";
import { scheduleStatus, endOfWeek, remainingLabel, fromLocalInput, toLocalInput } from "./schedule.ts";
import { parseMarkdown, parseInline } from "./markdown.ts";
import { buildTree } from "./tree.ts";
import { getPresets } from "./presets.ts";

test("parses allow-listed video URLs only", () => {
  assert.deepEqual(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), { provider: "youtube", videoId: "dQw4w9WgXcQ" });
  assert.deepEqual(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ"), { provider: "youtube", videoId: "dQw4w9WgXcQ" });
  assert.deepEqual(parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ"), { provider: "youtube", videoId: "dQw4w9WgXcQ" });
  assert.deepEqual(parseVideoUrl("https://www.tiktok.com/@user/video/7234567890123456789"), { provider: "tiktok", videoId: "7234567890123456789" });
  assert.equal(parseVideoUrl("https://evil.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseVideoUrl("javascript:alert(1)"), null);
});

test("validates coupon, community and text configs", () => {
  assert.deepEqual(validateConfig("coupon", { code: " X10 ", discount: "10%" }), { code: "X10", discount: "10%", validUntil: undefined });
  assert.throws(() => validateConfig("coupon", { code: "" }), /código/);
  assert.throws(() => validateConfig("coupon", { code: "<script>" }), /letras/);
  assert.throws(() => validateConfig("community", { platform: "myspace" }), /plataforma/);
  assert.throws(() => validateConfig("text", { markdown: "x".repeat(2001) }), /2000/);
  assert.equal(readConfig("video", { provider: "vimeo", videoId: "1" }), null);
  assert.deepEqual(validateConfig("link", { anything: 1 }), {});
});

test("validates block URLs per type", () => {
  assert.equal(validateBlockUrl("coupon", ""), null);
  assert.throws(() => validateBlockUrl("product", ""), /URL/);
  assert.throws(() => validateBlockUrl("product", "mailto:a@b.co"), /URL/);
  assert.equal(validateBlockUrl("link", "tel:+5511999999999"), "tel:+5511999999999");
});

test("computes schedule status", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  assert.equal(scheduleStatus({ active: false, starts_at: null, ends_at: null }, now), "hidden");
  assert.equal(scheduleStatus({ active: true, starts_at: "2026-10-08T00:00:00Z", ends_at: null }, now), "scheduled");
  assert.equal(scheduleStatus({ active: true, starts_at: null, ends_at: "2026-10-07T11:00:00Z" }, now), "expired");
  assert.equal(scheduleStatus({ active: true, starts_at: null, ends_at: null }, now), "live");
});

test("end of week is upcoming Sunday 23:59", () => {
  const end = endOfWeek(new Date(2026, 9, 7, 10)); // Wednesday
  assert.equal(end.getDay(), 0);
  assert.equal(end.getDate(), 11);
  assert.equal(end.getHours(), 23);
  assert.equal(remainingLabel("2026-10-09T15:00:00Z", new Date("2026-10-07T12:00:00Z")), "2d 3h");
  assert.equal(remainingLabel("2026-10-07T11:00:00Z", new Date("2026-10-07T12:00:00Z")), null);
  assert.equal(fromLocalInput(toLocalInput("2026-10-07T12:30:00.000Z")), "2026-10-07T12:30:00.000Z");
});

test("markdown never emits unsafe links", () => {
  assert.deepEqual(parseInline("[x](javascript:alert(1))"), [{ kind: "text", value: "x" }, { kind: "text", value: ")" }]);
  const blocks = parseMarkdown("Olá **mundo** e *você*\n\n- um\n- [dois](https://a.co)");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[1].kind, "list");
});

test("builds panel tree ordered by sort_order", () => {
  const tree = buildTree([
    { id: "c2", parent_id: "p", sort_order: 1 },
    { id: "p", parent_id: null, sort_order: 1 },
    { id: "c1", parent_id: "p", sort_order: 0 },
    { id: "a", parent_id: null, sort_order: 0 },
    { id: "orphan", parent_id: "missing", sort_order: 0 },
  ]);
  assert.deepEqual(tree.map((n) => n.id), ["a", "p"]);
  assert.deepEqual(tree[1].children.map((n) => n.id), ["c1", "c2"]);
});

test("presets contain only valid configs", () => {
  for (const preset of getPresets()) {
    assert.equal(preset.panel.type, "panel");
    assert.ok(preset.panel.layout);
    for (const child of preset.children) assert.doesNotThrow(() => validateConfig(child.type, child.config ?? {}), `${preset.id}/${child.title}`);
  }
});
