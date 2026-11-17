#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
VC="$ROOT/node_modules/.bin/vercel"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.local"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

echo "Waiting for Vercel login..."
for i in $(seq 1 90); do
  if "$VC" whoami >/dev/null 2>&1; then
  echo "Logged in as: $($VC whoami)"
    break
  fi
  sleep 2
done

if ! "$VC" whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: npx vercel login --github"
  exit 1
fi

cd "$ROOT"
"$VC" link --yes --project ac-manager 2>/dev/null || "$VC" link --yes

add_env() {
  local key="$1" val="$2"
  if printf '%s' "$val" | "$VC" env add "$key" production --force >/dev/null 2>&1; then
    echo "env $key (production)"
  else
    printf '%s' "$val" | "$VC" env add "$key" production
  fi
  printf '%s' "$val" | "$VC" env add "$key" preview --force >/dev/null 2>&1 || true
  printf '%s' "$val" | "$VC" env add "$key" development --force >/dev/null 2>&1 || true
}

add_env NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:?}"
add_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?}"

echo "Deploying..."
"$VC" --prod --yes

echo "Done. Production URL above."