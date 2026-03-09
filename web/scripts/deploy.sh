#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  sidequest.me — One-command deploy
#  Pushes to GitHub, deploys to Vercel,
#  and configures your custom domain.
# ─────────────────────────────────────────────

DOMAIN="sidequest.me"
REPO_NAME="sidequest-site"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀  sidequest.me deploy script     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight checks ──────────────────────
check_tool() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${YELLOW}⚠  $1 not found. Installing...${NC}"
    case "$1" in
      gh) brew install gh ;;
      vercel) npm install -g vercel ;;
      *) echo "Please install $1 manually." && exit 1 ;;
    esac
  fi
}

echo -e "${CYAN}[1/5]${NC} Checking tools..."
check_tool git
check_tool gh
check_tool vercel
echo -e "${GREEN}  ✓ All tools ready${NC}"

# ── GitHub authentication ──────────────────
echo ""
echo -e "${CYAN}[2/5]${NC} GitHub setup..."
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}  → Logging into GitHub...${NC}"
  gh auth login
fi

# Create repo + push
if ! gh repo view "$REPO_NAME" &> /dev/null 2>&1; then
  echo -e "  → Creating private repo: ${GREEN}$REPO_NAME${NC}"
  gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
else
  echo -e "  → Repo exists, pushing..."
  git remote get-url origin &> /dev/null 2>&1 || \
    git remote add origin "$(gh repo view "$REPO_NAME" --json url -q .url).git"
  git push -u origin main
fi
echo -e "${GREEN}  ✓ Code pushed to GitHub${NC}"

# ── Vercel deployment ──────────────────────
echo ""
echo -e "${CYAN}[3/5]${NC} Deploying to Vercel..."
if ! vercel whoami &> /dev/null 2>&1; then
  echo -e "${YELLOW}  → Logging into Vercel...${NC}"
  vercel login
fi

# Link and deploy
if [ ! -d ".vercel" ]; then
  echo -e "  → Linking project..."
  vercel link --yes
fi

echo -e "  → Deploying to production..."
DEPLOY_URL=$(vercel deploy --prod --yes 2>&1 | grep -oE 'https://[^ ]+')
echo -e "${GREEN}  ✓ Deployed: ${DEPLOY_URL}${NC}"

# ── Domain configuration ───────────────────
echo ""
echo -e "${CYAN}[4/5]${NC} Configuring domain: ${GREEN}${DOMAIN}${NC}"
vercel domains add "$DOMAIN" --yes 2>/dev/null || true
echo ""
echo -e "${YELLOW}  ╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}  ║  DNS RECORDS TO ADD AT YOUR DOMAIN REGISTRAR:     ║${NC}"
echo -e "${YELLOW}  ╠════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}  ║                                                    ║${NC}"
echo -e "${YELLOW}  ║  Type: A     Name: @    Value: 76.76.21.21         ║${NC}"
echo -e "${YELLOW}  ║  Type: CNAME Name: www  Value: cname.vercel-dns.com║${NC}"
echo -e "${YELLOW}  ║                                                    ║${NC}"
echo -e "${YELLOW}  ╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  After updating DNS, verify with:"
echo -e "  ${CYAN}vercel domains inspect ${DOMAIN}${NC}"

# ── Environment variables ──────────────────
echo ""
echo -e "${CYAN}[5/5]${NC} Environment variables..."
echo -e "  To connect Notion CMS, run these commands:"
echo ""
echo -e "  ${CYAN}vercel env add NOTION_API_KEY production${NC}"
echo -e "  ${CYAN}vercel env add NOTION_DATABASE_ID production${NC}"
echo ""

# ── Done! ──────────────────────────────────
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅  Deploy complete!                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                      ║${NC}"
echo -e "${GREEN}║   Site: ${DEPLOY_URL:-https://sidequest.me}  ${NC}"
echo -e "${GREEN}║   Repo: github.com/$(gh api user -q .login)/${REPO_NAME}  ${NC}"
echo -e "${GREEN}║                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
