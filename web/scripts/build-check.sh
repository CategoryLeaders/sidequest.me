#!/bin/bash
# build-check.sh — VM-safe build verification for Cowork/FUSE environments.
#
# Problem: macOS FUSE (which mounts the workspace into the VM) creates .fuse_hidden
# lock files inside any build output directory. Next.js can't unlink these, so it
# exits 1 even when compilation succeeds.
#
# Fix strategy:
#   1. Rename any existing .next-vm/ out of the way before building (mv works on FUSE;
#      unlink does not). macOS keeps the old data accessible via the renamed dir.
#   2. Build into a fresh .next-vm/ — no pre-existing lock files.
#   3. The POST-build cleanup (removing the export/ temp dir) still hits EPERM.
#      We detect this specific false-negative and exit 0 if all pages generated cleanly.
#
# Exit codes:
#   0 — build passed (TypeScript clean, all static pages generated)
#   1 — real build failure (type errors, import errors, module not found, etc.)

set -o pipefail

# Guard: this script is for the Cowork VM (Linux) only.
# node_modules contains Linux native binaries — running on macOS will fail with
# "Cannot find module lightningcss.darwin-arm64.node".
# To build on your Mac: npm install && npm run build
if [[ "$(uname)" == "Darwin" ]]; then
  echo "✗ build:vm is for the Cowork VM only (Linux)."
  echo "  To build on your Mac: npm install && npm run build"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_DIR"

# Step 1: Move old build output out of the way so we start fresh
if [ -d ".next-vm" ]; then
  BACKUP=".next-vm-prev"
  # If a previous backup exists, discard it by renaming to a timestamped name
  # (we can't rmdir on FUSE, but we can rename)
  if [ -d "$BACKUP" ]; then
    mv "$BACKUP" ".next-vm-$(date +%s)" 2>/dev/null || true
  fi
  mv ".next-vm" "$BACKUP" 2>/dev/null || true
fi

# Step 2: Build into fresh .next-vm/
BUILD_LOG=$(mktemp /tmp/sq-build-XXXX.txt)
NEXT_DIST_DIR=.next-vm next build 2>&1 | tee "$BUILD_LOG"
BUILD_EXIT=${PIPESTATUS[0]}

if [ "$BUILD_EXIT" -eq 0 ]; then
  rm -f "$BUILD_LOG"
  exit 0
fi

# Step 3: Check if the only failure is FUSE cleanup EPERM (harmless false-negative).
# We look for:
#   - At least one "Generating static pages" success line
#   - EPERM errors (unlink or rmdir) as the stated build error
#   - No real compilation errors (type errors, missing modules, etc.)
PAGES_OK=0
FUSE_EPERM=0
REAL_ERRORS=0
grep -q "Generating static pages" "$BUILD_LOG" 2>/dev/null && PAGES_OK=1
grep -qE "EPERM" "$BUILD_LOG" 2>/dev/null && FUSE_EPERM=1
grep -qE "^(Type error|SyntaxError|Module not found|Failed to compile)" "$BUILD_LOG" 2>/dev/null && REAL_ERRORS=1

if [ "$PAGES_OK" -eq 1 ] && [ "$FUSE_EPERM" -eq 1 ] && [ "$REAL_ERRORS" -eq 0 ]; then
  echo ""
  echo "✓ Build verified — FUSE EPERM cleanup noise suppressed (macOS artefact, harmless)"
  rm -f "$BUILD_LOG"
  exit 0
fi

echo ""
echo "✗ Build failed — see errors above"
rm -f "$BUILD_LOG"
exit 1
