import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("opinion page uses an integrated form instead of mailto", () => {
  const page = read("src/app/opinion/page.tsx");
  const form = read("src/app/opinion/OpinionForm.tsx");

  assert.doesNotMatch(page, /mailto:/);
  assert.match(page, /<OpinionForm \/>/);
  assert.match(form, /httpClient\("\/api\/opinion"/);
  assert.match(form, /aria-live="polite"/);
});

test("public opinion submission has CSRF, rate limit and bot protection", () => {
  const route = read("src/app/api/opinion/route.ts");
  const middleware = read("src/middleware.ts");

  assert.match(route, /enforceCsrfProtection\(req\)/);
  assert.match(route, /enforceRequestRateLimit\(req/);
  assert.match(route, /body\.website/);
  assert.match(route, /sendFeedbackEmail\(feedback\)/);
  assert.match(middleware, /"\/opinion"/);
});

test("opinion email escapes user content and keeps contact optional", () => {
  const email = read("src/lib/emails/feedback.ts");

  assert.match(email, /escapeHtml\(answer\)/);
  assert.match(email, /FEEDBACK_TO_EMAIL/);
  assert.match(email, /replyTo/);
  assert.match(email, /No solicitó contacto/);
});
