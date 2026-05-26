# Setup · Phase 2 — Database & Auth

Everything you need to do **before I can start writing schema and auth code**.
~10–15 minutes end to end. Do these in order.

> **Stack decisions locked** (from prior session):
> Local Supabase via Docker · Google OAuth + email/password · magic-link
> verification required before checkout · disposable-email blocklist ·
> admin auth via magic-link + `ADMIN_EMAILS` allowlist · browse open,
> auth wall at `/checkout`.

---

## 0 · Prerequisites

You already have: Node 24, pnpm, git, and the repo cloned.

You'll add: Docker Desktop + Supabase CLI + one Google Cloud project +
two `.env.local` updates.

---

## 1 · Install Docker Desktop

Local Supabase runs as a stack of containers (Postgres, GoTrue, PostgREST,
Storage, Realtime, Inbucket for email). Docker Desktop is the easiest way
to get the container runtime on Mac.

```bash
# Install via Homebrew (recommended)
brew install --cask docker

# Then launch Docker Desktop from /Applications. First launch will ask
# you to grant privileged-helper access and may prompt for a Docker
# account (you can skip the account — Personal use is free).
```

Verify it's running:

```bash
docker info
# Should print server info, no error.
```

If `docker info` says `Cannot connect to the Docker daemon`, open Docker
Desktop from /Applications and wait for the whale icon in the menu bar
to settle.

---

## 2 · Install Supabase CLI

```bash
# Via Homebrew (recommended on Mac)
brew install supabase/tap/supabase

# Verify
supabase --version
# Should print something like 1.250.x or later.
```

---

## 3 · Initialize local Supabase in the repo

> I'll do this part as the first step of Phase 2.1. **Don't run `supabase
> init` yet.** Listed here only so you know what's coming.

The first time we run `supabase start`, the CLI will download ~5 container
images (~1.5 GB). It takes 2–3 minutes on a decent connection — one-time
cost. Subsequent starts are instant.

What you'll get when it's running:
- **Postgres** on `localhost:54322` (full database)
- **PostgREST / API** on `localhost:54321`
- **Studio** (Supabase's web admin UI) on `localhost:54323`
- **Inbucket** (catches ALL emails sent in dev — magic links, OTPs, etc.)
  on `localhost:54324`

The CLI prints these URLs and keys on startup. We'll capture the local
keys into `.env.local`.

---

## 4 · Create a Google Cloud OAuth app

This is the one part that requires their dashboard. You'll do this once
and reuse the credentials for local dev AND the eventual production
Supabase project.

### 4.1 — Create or pick a Google Cloud project

1. Go to **https://console.cloud.google.com**.
2. Top-left dropdown → **New Project**.
3. Name it `Advaita` (or anything). Click **Create**.
4. Wait for the project to provision (~10 seconds), then select it from
   the dropdown.

### 4.2 — Configure the OAuth consent screen

1. Left sidebar → **APIs & Services** → **OAuth consent screen**.
2. User Type: **External**. Click **Create**.
3. Fill in the minimum required:
   - App name: `Advaita`
   - User support email: `shubhamhelpseries@gmail.com`
   - Developer contact email: same.
   - App logo: skip for now (can add later — we'll generate one in Phase 8).
4. Click **Save and Continue**.
5. **Scopes**: click **Add or remove scopes**, check `email`, `profile`,
   `openid`. Save and continue.
6. **Test users**: add your own email + Mom's email (so you can test the
   OAuth flow before publishing the app).
7. **Save** and click back to the dashboard.

### 4.3 — Create OAuth credentials

1. Left sidebar → **APIs & Services** → **Credentials**.
2. Top: **+ Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Advaita Web (dev + prod)`.
5. **Authorized JavaScript origins** — add:
   - `http://localhost:3000`
   - `http://localhost:54321`
   - (We'll add the production domain in Phase 9 when we deploy.)
6. **Authorized redirect URIs** — add:
   - `http://localhost:54321/auth/v1/callback`
   - (Production redirect added in Phase 9.)
7. Click **Create**.

A modal pops up with **Client ID** and **Client Secret**. Copy both — you'll
paste them into `.env.local` in step 6.

> Treat the Client Secret like a password. Never commit it.

---

## 5 · (Skip until Phase 9) Create a hosted Supabase production project

For local dev we don't need a hosted project yet. When we get to Phase 9
deployment, you'll create one at `supabase.com`, paste in the same Google
OAuth credentials, and add the production redirect URI.

If you want to do it now anyway: `supabase.com` → New project → free tier
→ pick `Mumbai` region (closest to your customers).

---

## 6 · Wire env vars

Open `.env.local` (it's gitignored — never committed) and add:

```bash
# ---- Public site URL ----
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ---- Supabase (local — populated automatically once supabase start runs)
# Leave these placeholders for now; Phase 2.1 will fill them in.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ---- Google OAuth (from step 4.3) ----
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# ---- Admin allowlist ----
# Comma-separated, no spaces. These emails can sign in to /admin.
ADMIN_EMAILS=shubhamhelpseries@gmail.com
```

`.env.example` will be updated to mirror this shape (with placeholders
only) so future contributors know what's needed.

---

## 7 · Verification checklist

When all of the above is done, you should be able to:

- [ ] `docker info` runs without error.
- [ ] `supabase --version` prints a version number.
- [ ] You have a Google Cloud OAuth client ID and secret saved.
- [ ] `.env.local` has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
      `ADMIN_EMAILS` populated (Supabase URLs come in Phase 2.1).
- [ ] Repository builds clean: `pnpm build`.

**Tell me when these check out and I'll start Phase 2.1.**

---

## Troubleshooting

**"Cannot connect to the Docker daemon"** — Docker Desktop isn't running.
Open it from /Applications.

**`supabase: command not found`** — Homebrew installed it but your shell
hasn't reloaded. Run `exec $SHELL` or open a new terminal.

**"This app isn't verified" warning during Google OAuth** — expected
while the OAuth consent screen is in Testing mode. Click **Advanced** →
**Go to Advaita (unsafe)**. The warning goes away when we publish the app
in Phase 9.

**Local supabase containers take forever to download** — they're ~1.5 GB
total. One-time. Subsequent `supabase start` calls launch in seconds.

**`supabase start` fails on port conflict** — something else is using
port 54321/54322/54323/54324. `lsof -i :54321` to find the process; kill
it or change the port via `supabase/config.toml`.

---

## What happens next

Once your verification checklist is green, ping me. I'll execute:

| Step | Output |
|---|---|
| Phase 2.1 | `supabase init`, scaffold `src/lib/supabase/`, run `supabase start`, populate the three Supabase env vars in `.env.local` for you. |
| Phase 2.2 | Core schema migrations + RLS (users / books / orders / carts). |
| Phase 2.3 | Auxiliary schema migrations + RLS (access_grants / coupons / community). |
| Phase 2.4 | Customer auth flows (sign-in / sign-up / Google OAuth / verification / blocklist). |
| Phase 2.5 | Admin auth + route middleware. |
| Phase 2.6 | Navbar wires up signed-in state. |

Each step is a separate commit (or 2–3 small commits).
