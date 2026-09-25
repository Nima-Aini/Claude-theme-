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

test("stands are independently stored, admin protected, and accepted by orders", async () => {
  const migration = await read("src/db/stands-migration.sql");
  const api = await read("src/app/api/stands/route.ts");
  const orders = await read("src/app/api/orders/route.ts");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS stands/i);
  assert.match(migration, /is_active BOOLEAN NOT NULL DEFAULT true/i);
  assert.match(api, /requireAdmin/);
  assert.match(orders, /itemType.*stand/s);
  assert.match(orders, /stands\.stock} - \$\{stands\.reservedStock} >= \$\{item\.quantity}/);
});

test("checkout leaves financial and inventory effects for verified payment", async () => {
  const route = await read("src/app/api/orders/route.ts");
  assert.doesNotMatch(route, /body\.totalAmount|sendOrderSMS/);
  assert.match(route, /paymentStatus: "pending"/);
  assert.match(route, /status: "pending_payment"/);
  assert.match(route, /reservedStock: sql/);
  assert.doesNotMatch(route, /stock: sql\x60.*stock} -/);
});

test("storefront has mobile edge-to-edge shop banner and shared section divider", async () => {
  const store = await read("src/app/store/[slug]/StoreClient.tsx");
  assert.match(store, /w-full overflow-hidden aspect-\[2\/1\][^\n]+sm:mx-4/);
  assert.match(store, /function SectionDivider/);
  assert.match(store, /footer_legal_text/);
});

test("root redirects server-side only to the Hosseini store", async () => {
  const home = await read("src/app/page.tsx");
  assert.match(home, /import \{ redirect \} from "next\/navigation"/);
  assert.match(home, /redirect\("\/store\/hosseini"\)/);
  assert.doesNotMatch(home, /window\.location/);
});

test("shared Enamad badge preserves the official trust-seal markup", async () => {
  const badge = await read("src/components/EnamadBadge.tsx");
  const store = await read("src/app/store/[slug]/StoreClient.tsx");
  assert.match(badge, /href="https:\/\/trustseal\.enamad\.ir\/\?id=7452237&Code=P60yaoafM9r9twpvfb1fhmxsak1by8uF"/);
  assert.match(badge, /src="https:\/\/trustseal\.enamad\.ir\/logo\.aspx\?id=7452237&Code=P60yaoafM9r9twpvfb1fhmxsak1by8uF"/);
  assert.equal((badge.match(/referrerPolicy="origin"/g) || []).length, 2);
  assert.match(badge, /target="_blank"/);
  assert.match(badge, /alt=""/);
  assert.match(badge, /style=\{\{ cursor: "pointer" \}\}/);
  assert.match(badge, /code="P60yaoafM9r9twpvfb1fhmxsak1by8uF"/);
  assert.doesNotMatch(badge, /aria-label|rel=|<(?:a|img)[^>]*className=/);
  assert.doesNotMatch(badge, /dangerouslySetInnerHTML|<script/i);
  assert.equal((store.match(/<EnamadBadge/g) || []).length, 2);
});

test("SMS uses server-only Console Token API without legacy credentials", async () => {
  const sms = await read("src/lib/sms.ts");
  const otpRoute = await read("src/app/api/auth/otp/send/route.ts");
  assert.match(sms, /https:\/\/console\.melipayamak\.com\/api\/send/);
  assert.match(sms, /process\.env\.MELIPAYAMAK_TOKEN/);
  assert.match(sms, /application\/json/);
  assert.doesNotMatch(sms, /rest\.payamak-panel|SMS_USERNAME|SMS_PASSWORD|URLSearchParams/);
  assert.match(otpRoute, /success: false[\s\S]+status: 502/);
  assert.doesNotMatch(otpRoute, /console\.log[\s\S]*OTP/);
  assert.ok(otpRoute.indexOf("if (!sent)") < otpRoute.indexOf("db.insert(otpCodes)"));
});
