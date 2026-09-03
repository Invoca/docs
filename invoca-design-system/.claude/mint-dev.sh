#!/usr/bin/env bash
# Shim so the Mintlify dev server can be launched with this directory
# (invoca-design-system/) as the working directory. `mint dev` must run
# from the repo root, where docs.json lives, so this just cd's there and
# re-execs the real launcher script.
set -euo pipefail
cd "$(dirname "$0")/../.."
exec ./.claude/mint-dev.sh
