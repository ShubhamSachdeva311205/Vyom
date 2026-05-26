#!/usr/bin/env bash
# Wraps `supabase <cmd>` so the CLI sees .env.local values during
# config.toml env() substitution.
#
# Why: supabase/config.toml references env vars (e.g.
# SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET) via env() at config-load time.
# The CLI reads only the shell env, not .env.local (Next.js convention).
# This wrapper sources .env.local first, then exec's supabase.

set -e

cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

exec supabase "$@"
