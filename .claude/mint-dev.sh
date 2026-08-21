#!/usr/bin/env bash
# Start the Mintlify dev server.
# Auto-detects a Node install (nvm, fnm, Homebrew, or system) instead of
# hardcoding a single user's path, then runs `mint dev`.

set -euo pipefail

# Prepend common Node locations to PATH if present.
for candidate in \
  "$HOME/.nvm/versions/node"/*/bin \
  "$HOME/.fnm"/*/bin \
  "$HOME/.volta/bin" \
  "/opt/homebrew/bin" \
  "/usr/local/bin"; do
  [ -d "$candidate" ] && PATH="$candidate:$PATH"
done

# If nvm is installed but no version is on PATH yet, load its default.
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi

export PATH

if ! command -v mint >/dev/null 2>&1; then
  echo "error: 'mint' CLI not found on PATH." >&2
  echo "Install Node.js (v19+) and then run: npm i -g mint" >&2
  exit 127
fi

exec mint dev
