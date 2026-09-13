type Entry = { failures: number; firstFailure: number; blockedUntil: number };
const attempts = new Map<string, Entry>();
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;

export function loginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.firstFailure > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, retryAfter: 0 };
  }
  const retryAfter = Math.max(0, Math.ceil((current.blockedUntil - now) / 1000));
  return { allowed: retryAfter === 0, retryAfter };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  const entry = !current || now - current.firstFailure > WINDOW_MS
    ? { failures: 1, firstFailure: now, blockedUntil: 0 }
    : { ...current, failures: current.failures + 1 };
  if (entry.failures >= MAX_FAILURES) {
    entry.blockedUntil = now + Math.min(15 * 60_000, 30_000 * 2 ** (entry.failures - MAX_FAILURES));
  }
  attempts.set(key, entry);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
