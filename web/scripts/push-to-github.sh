#!/bin/bash
# Run from your Mac terminal:
#   cd ~/Sidequests/Sidequest.me
#   chmod +x push-to-github.sh && ./push-to-github.sh

set -e

# Clean up any lock files from the sandbox
rm -f .git/index.lock 2>/dev/null

# Ensure we're on main branch
git branch -m main 2>/dev/null || true

# Set remote
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/CategoryLeaders/sidequest.me.git

# Stage and commit (skip if already committed)
git add .
git diff --cached --quiet 2>/dev/null && echo "✅ Already committed" || \
  git commit -m "Initial commit — sidequest.me

Neo-Brutalist personal homepage built with Next.js, TypeScript & Tailwind CSS v4.

Pages: Home, About, Professional, Photos, Ideas & Thoughts, Projects"

# Push
git push -u origin main

echo ""
echo "✅ Pushed to https://github.com/CategoryLeaders/sidequest.me"
echo ""
echo "Next: Import into Vercel at https://vercel.com/new"
