#!/usr/bin/env bash
# Run the shared mint-dev script from the docs root, where docs.json lives.
set -euo pipefail
cd /Users/nconary/invoca/docs
exec /Users/nconary/invoca/docs/.claude/mint-dev.sh
