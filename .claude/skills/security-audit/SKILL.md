---
name: security-audit
description: Run a battery of attack scripts against the Advaita local dev server to surface auth, redirect, IDOR, injection, rate-limit, header, and exposure issues. ONLY for owner-authorized targets (localhost or pre-allowlisted staging). Authorized pentesting only.
---

# SECURITY-AUDIT — Advaita Live Attack Battery

> ⚠️  **PROCEED WITH CAUTION.** This skill runs probes that include
> mutating POSTs. Only target hosts you own or have explicit written
> authorization to test. Default target is `http://localhost:3000`.
> **Never** point at a third-party domain. **Never** run from CI
> without an explicit allowlist on the runner.

## What this skill does

Runs ten probe scripts against the storefront + auth + cart surfaces
and prints one line per probe with a leading `OK` / `FAIL` / `LEAK` /
`BYPASS` / `MISS` token. Categories:

1. Security-header check (CSP, HSTS, X-Frame-Options, etc.)
2. Open-redirect probe on `/auth/callback?next=…`
3. Auth bypass on `/admin` (no session + forged JWT)
4. SQL-injection probes on the sign-in Server Action
5. Cart IDOR / cookie-swap probe
6. Coupon brute-force + race-condition (Phase 3 TODO)
7. Disposable-email bypass (Gmail dots, plus-addressing, IDN)
8. Rate-limit probe (10x sign-in in <1s, expect 429)
9. Static-file exposure (`.env`, `.git/*`, `.next/standalone`)
10. XSS submission to community/feedback (Phase 6 TODO)

Each script is self-contained Python (uses `requests` / `httpx`).
Runs against `$AUDIT_TARGET` env var; falls back to
`http://localhost:3000`.

## Invocation

The user types one of:

- `/security-audit` — run the full battery against
  `http://localhost:3000`. Make sure `pnpm dev` is running first.
- `/security-audit --target=https://staging.advaita.app` — alternate
  authorized host. Refuse to proceed if the target doesn't look like
  localhost / a `.advaita.` subdomain / an explicit allowlist; ask
  the user for written-out authorization before continuing.
- `/security-audit --only=headers,redirect,exposure` — run a subset.
- `/security-audit --no-mutating` — skip probes that POST.

Before running anything, the model should:

1. Confirm with the user that `pnpm dev` is up
   (curl `http://localhost:3000` → expect 200).
2. Confirm `python3 -m requests --version` works
   (`python3 -m pip install --user requests httpx` if not).
3. **Suspend the run if the target isn't localhost AND the user
   hasn't explicitly named a host they own.** Print the target host
   back to them and ask for a single-line confirmation.

After the run, the model should:

1. Summarise findings: count per severity bucket
   (`LEAK`/`FAIL`/`BYPASS` are P0/P1; `MISS` is P2 hardening).
2. For each non-OK probe, suggest the concrete fix from the
   in-repo audit notes (`BUILD-JOURNAL.md → Phase-pre-3 security
   audit` section) or file a new issue via `gh issue create`.
3. If the user ran mutating probes (default), remind them to reset
   local dev data: `pnpm supabase:stop && pnpm supabase:start` (or
   `./scripts/supabase-with-env.sh db reset` once that script
   accepts subcommands).

---

## Setup

```bash
python3 -m pip install --user requests httpx 2>/dev/null || true
export AUDIT_TARGET="${AUDIT_TARGET:-http://localhost:3000}"
echo "Auditing $AUDIT_TARGET"
```

## Scripts

### 1. Header check (CSP / HSTS / clickjacking)

```bash
python3 - <<'PY'
import os, requests
r = requests.get(os.environ.get("AUDIT_TARGET","http://localhost:3000"))
need = ["content-security-policy","strict-transport-security",
        "x-frame-options","x-content-type-options","referrer-policy",
        "permissions-policy"]
for h in need:
    v = r.headers.get(h)
    print(f"  {'OK  ' if v else 'MISS'}  {h:30s} {v or ''}")
PY
```

**Interpret:** every `MISS` is a header to add. As of 2026-05-27, all
six are missing on this project. Fix in `next.config.ts` via a
`headers()` block.

### 2. Open-redirect probe on `/auth/callback`

```bash
python3 - <<'PY'
import os, requests
base = os.environ["AUDIT_TARGET"]
payloads = [
  "//evil.com", "/\\evil.com", "https://evil.com",
  "//evil.com/login", "/./..//evil.com",
  "javascript:alert(1)", "/%2F/evil.com",
]
for p in payloads:
    r = requests.get(f"{base}/auth/callback",
                     params={"code":"x","next":p},
                     allow_redirects=False)
    loc = r.headers.get("location","")
    bad = any(s in loc for s in ("evil.com","javascript:"))
    print(f"  {'FAIL' if bad else 'OK  '}  next={p!r:30s} → {loc}")
PY
```

**Interpret:** any `FAIL` = exploitable open redirect. The `next`
filter is currently `startsWith("/")` which permits `//evil.com`
(protocol-relative URL). Tighten to also reject `//` and `/\\`
prefixes, ideally by parsing with `new URL(...)` and asserting same-
origin.

### 3. Auth bypass on `/admin`

```bash
python3 - <<'PY'
import os, requests
base = os.environ["AUDIT_TARGET"]
# (a) no session
r1 = requests.get(f"{base}/admin", allow_redirects=False)
print("  no-session    →", r1.status_code, r1.headers.get("location",""))
# (b) random sb-access-token cookie
forged = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhdHRhY2tlciJ9.x"
r2 = requests.get(f"{base}/admin",
                  cookies={"sb-access-token": forged},
                  allow_redirects=False)
print("  forged-jwt    →", r2.status_code, r2.headers.get("location",""))
PY
```

**Interpret:** both should redirect (307) to `/admin/sign-in`. A 200
anywhere is critical. Currently the middleware also reads
`ADMIN_EMAILS` env var — if an attacker-controlled address ever
lands in that env, they sign in as admin via magic-link with no
second factor.

### 4. SQL-injection probes on Server Actions

```bash
python3 - <<'PY'
import os, time, requests
base = os.environ["AUDIT_TARGET"]
payloads = ["' OR '1'='1", "'; DROP TABLE users--", "1' UNION SELECT NULL--",
            "1; SELECT pg_sleep(5)--", "𝕊", "../../etc/passwd"]
for p in payloads:
    t0 = time.time()
    r = requests.post(f"{base}/sign-in",
                      data={"email": p, "password": p},
                      allow_redirects=False)
    dt = time.time() - t0
    leak = any(s in r.text.lower() for s in ("syntax error","pg_","sql","postgres"))
    slow = dt > 3
    flag = "LEAK" if leak else "SLOW" if slow else "OK  "
    print(f"  {flag}  {p[:30]:30s} → {r.status_code} ({dt:.2f}s)")
PY
```

**Interpret:** Supabase JS client uses parameterized queries
throughout, so leaks are not expected. Any `LEAK` or `SLOW` (>3s)
warrants investigation — could indicate a raw `.rpc()` with user
input concatenation.

### 5. Cart IDOR / cookie-swap

```bash
python3 - <<'PY'
import os, uuid, requests
base = os.environ["AUDIT_TARGET"]
forged = str(uuid.uuid4())
s = requests.Session()
s.cookies.set("adv_cart_session", forged)
r = s.get(f"{base}/cart")
print(f"  forged anon cookie {forged[:8]}… → {r.status_code} "
      f"({'empty (OK)' if 'empty' in r.text.lower() else 'inspect manually'})")
PY
```

**Interpret:** without a leaked real UUID, IDOR is infeasible
(122-bit search space). Confirms the bearer-cookie pattern's risk
model: if a UUID ever leaks (XSS, log, side-channel), the attacker
gets full cart control with no second binding. Fix: HMAC-sign the
cookie value with a server secret.

### 6. Coupon brute-force + race (Phase 3.1 TODO)

```bash
python3 - <<'PY'
# Wire to /api/coupon/redeem (or the Server Action) when Phase 3.1 lands.
# Skeleton:
import os, asyncio, httpx
async def hit(c, code):
    return await c.post(f"{os.environ['AUDIT_TARGET']}/api/coupon/redeem",
                        json={"code": code})
async def main():
    async with httpx.AsyncClient() as c:
        rs = await asyncio.gather(*[hit(c, "STUDENT10") for _ in range(50)])
        ok = sum(1 for r in rs if r.status_code == 200)
        print(f"  50 parallel redemptions of STUDENT10 → {ok} succeeded "
              f"({'RACE' if ok>1 else 'atomic OK'})")
# asyncio.run(main())
print("  TODO: enable when Phase 3.1 coupon endpoint exists")
PY
```

**Interpret:** >1 success on a `single_use` code = race condition.
Fix with a SECURITY DEFINER `redeem_coupon()` plpgsql function that
does `SELECT … FOR UPDATE` inside a single transaction.

### 7. Disposable-email bypass

```bash
python3 - <<'PY'
import os, requests
base = os.environ["AUDIT_TARGET"]
emails = [
  "shubham+throwaway1@gmail.com",
  "s.h.u.b.h.a.m@gmail.com",
  "test@mаilinator.com",       # Cyrillic а — IDN lookalike
  "user@10minutemail.guru",    # newer disposable TLD
]
for e in emails:
    r = requests.post(f"{base}/sign-up",
                      data={"email": e, "password": "Aa1!aaaa", "fullName": "x"})
    bypassed = "smarty pants" not in r.text
    print(f"  {'BYPASS' if bypassed else 'BLOCK '}  {e}")
PY
```

**Interpret:** any `BYPASS` on a disposable variant = a coupon-
multi-redemption vector. Fix: canonicalize Gmail (strip dots +
`+suffix`), punycode-normalize all domains, reject mixed-script
local-parts.

### 8. Rate-limit probe

```bash
python3 - <<'PY'
import os, time, requests
base = os.environ["AUDIT_TARGET"]
t0 = time.time()
codes = [requests.post(f"{base}/sign-in",
                       data={"email": f"x{i}@x.test", "password": "z"}).status_code
         for i in range(10)]
print(f"  10 logins in {time.time()-t0:.1f}s: {codes}  "
      f"({'no rate limit' if 429 not in codes else 'limited'})")
PY
```

**Interpret:** no 429 = no rate limit. As of 2026-05-27 there are no
rate limits anywhere. Cloudflare rules ship in Phase 9; until then,
add an in-process token bucket per IP for `signin` / `signup` /
`verifyOtp`.

### 9. Static-file / dot-file exposure

```bash
python3 - <<'PY'
import os, requests
base = os.environ["AUDIT_TARGET"]
paths = [".env",".env.local",".env.production",".git/config",".git/HEAD",
         ".next/standalone/.env","backup.sql","supabase/.env",
         "package.json",".DS_Store","node_modules/.bin/next"]
for p in paths:
    r = requests.get(f"{base}/{p}", allow_redirects=False)
    flag = "LEAK!" if r.status_code == 200 else "OK"
    print(f"  {flag:6s}  {r.status_code}  /{p}")
PY
```

**Interpret:** any 200 on `.env*` / `.git/*` / `*.sql` is critical.
Next.js by default doesn't serve dot-files but a misconfigured proxy
or static export can.

### 10. XSS — community + feedback (Phase 6 TODO)

```bash
# When /community and /feedback POST forms exist:
# - POST a submission with body=<img src=x onerror=alert(1)>
# - GET the public listing and assert the payload is escaped
#   (look for &lt; / &amp; in the rendered HTML, NOT the raw < and >)
# - Repeat with srcdoc, javascript: URLs, mathml/svg payloads
echo "  TODO: enable when Phase 6 community + feedback forms exist"
```

### 11. Razorpay webhook HMAC (Phase 3.1 TODO)

```bash
# When /api/webhooks/razorpay exists:
# - POST a payment.captured body with no X-Razorpay-Signature → expect 401
# - POST with wrong signature → expect 401
# - POST with valid signature but stale timestamp → expect 401
# - Replay a previously-valid payload → expect 200 first, 409 second (idempotency)
echo "  TODO: enable when Phase 3.1 webhook lands"
```

---

## Output convention

Each probe prints one line. Tokens:

| Token  | Meaning                                                |
|--------|--------------------------------------------------------|
| `OK`   | Probe passed — no issue detected                       |
| `MISS` | A defensive control is missing (e.g. CSP header)       |
| `FAIL` | Probe demonstrated an exploit path                     |
| `LEAK` | Sensitive info leaked in response body / headers       |
| `BYPASS` | A blocklist / filter was circumvented                 |
| `SLOW` | Time-based oracle hit — possible blind-injection vector|
| `RACE` | Concurrent requests succeeded where one should         |

To get a clean exploit summary:

```bash
… | grep -E '^  (FAIL|LEAK|BYPASS|RACE)'
```

## Post-run cleanup

```bash
# If mutating probes ran (default), reset local Supabase data:
pnpm supabase:stop && pnpm supabase:start
# Then re-seed (if you have data you want back):
pnpm supabase db reset --linked   # or your seed script
```

---

## Where the fix recipes live

In-repo audit notes for each finding live in
`BUILD-JOURNAL.md → "Pre-Phase-3 security audit"` section
(2026-05-27 entry). Reference the finding numbers (#1–#21) when
filing or fixing.
