import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("admin login contains no master bypass or plaintext fallback", async () => {
  const login = await read("src/app/api/auth/admin/route.ts");
  assert.doesNotMatch(login, /VALID_MASTER|isMaster|admin\.password\s*===\s*password/);
  assert.match(login, /bcryptjs\.compare/);
  assert.match(login, /status:\s*429/);
});

test("JWT has no fixed fallback and production requires a strong secret", async () => {
  const auth = await read("src/lib/auth.ts");
  assert.doesNotMatch(auth, /process\.env\.JWT_SECRET\s*\|\|\s*["']/);
  assert.match(auth, /NODE_ENV === "production"/);
  assert.match(auth, /length >= 32/);
});

test("secondary slug migration is nullable and uniquely indexed", async () => {
  const migration = await read("src/db/secure-media-secondary-slug-migration.sql");
  assert.match(migration, /secondary_slug VARCHAR\(255\)/);
  assert.match(migration, /UNIQUE INDEX[\s\S]+WHERE secondary_slug IS NOT NULL/i);
});

test("alias pages preserve product path and query strings", async () => {
  const store = await read("src/app/store/[slug]/page.tsx");
  const product = await read("src/app/store/[slug]/product/[id]/page.tsx");
  assert.match(store, /permanentRedirect[\s\S]+querySuffix/);
  assert.match(product, /product\/\$\{id\}[\s\S]+querySuffix/);
});

test("media paths are contained and uploads inspect image metadata", async () => {
  const storage = await read("src/lib/storage/local.ts");
  const upload = await read("src/app/api/uploads/route.ts");
  assert.match(storage, /startsWith\(root \+ path\.sep\)/);
  assert.match(upload, /sharp\(source/);
  assert.match(upload, /limitInputPixels/);
});
