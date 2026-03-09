#!/bin/bash
# ============================================
# Sidequest.me — GitHub Setup Script
# Run this from your Mac terminal:
#   cd ~/Sidequests/Sidequest.me
#   chmod +x setup-github.sh && ./setup-github.sh
# ============================================

set -e

echo "🚀 Setting up GitHub repo for sidequest.me..."
echo ""

# Clean up any stale git state from the sandbox
if [ -f ".git/index.lock" ]; then
  rm -f .git/index.lock
fi

# Initialize if not already a git repo
if [ ! -d ".git" ]; then
  git init
  git branch -m main
  echo "✅ Git initialized on branch 'main'"
else
  echo "✅ Git repo already exists"
  # Ensure we're on main
  git branch -m main 2>/dev/null || true
fi

# Stage everything (gitignore handles exclusions)
git add .
echo "✅ Files staged"

# Create initial commit
git commit -m "Initial commit — sidequest.me

Neo-Brutalist personal homepage built with Next.js 16, TypeScript & Tailwind CSS v4.

Pages: Home, About, Professional, Photos, Ideas & Thoughts, Projects"

echo "✅ Initial commit created"
echo ""

# Create GitHub repo using gh CLI
echo "Creating GitHub repository..."
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) not found."
  echo "   Install it: brew install gh"
  echo "   Then re-run this script."
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "🔐 You need to log in to GitHub first:"
  gh auth login
fi

# Create private repo and push
gh repo create sidequest-me --private --source=. --remote=origin --push

echo ""
echo "============================================"
echo "✅ Done! Your repo is live at:"
echo "   https://github.com/$(gh api user -q .login)/sidequest-me"
echo ""
echo "Next step: Connect to Vercel"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import 'sidequest-me' from GitHub"
echo "   3. Deploy (it'll auto-detect Next.js)"
echo "   4. Add domain: sidequest.me in Project Settings → Domains"
echo "============================================"
