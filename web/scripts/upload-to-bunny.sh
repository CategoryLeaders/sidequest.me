#!/bin/bash
# =============================================================================
# Upload photowall images to Bunny.net Edge Storage
# =============================================================================
# Usage:
#   1. Set your credentials:
#        export BUNNY_STORAGE_ZONE="sidequest-photos"
#        export BUNNY_API_KEY="your-storage-api-key"
#        export BUNNY_STORAGE_REGION=""   # empty = Falkenstein DE (default)
#                                         # "uk" = London, "ny" = New York, etc.
#
#   2. Run:  ./scripts/upload-to-bunny.sh
#
# The script uploads all images from public/photowall/ to your Bunny storage
# zone under the /photowall/ path. It skips files that already exist (by name).
# =============================================================================

set -euo pipefail

# --- Config ---
STORAGE_ZONE="${BUNNY_STORAGE_ZONE:?Set BUNNY_STORAGE_ZONE first}"
API_KEY="${BUNNY_API_KEY:?Set BUNNY_API_KEY first}"
REGION="${BUNNY_STORAGE_REGION:-}"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/photowall"
REMOTE_PATH="photowall"
PARALLEL_UPLOADS=6
MAX_RETRIES=3

# Build the storage hostname
if [ -z "$REGION" ]; then
  STORAGE_HOST="storage.bunnycdn.com"
else
  STORAGE_HOST="${REGION}.storage.bunnycdn.com"
fi

BASE_URL="https://${STORAGE_HOST}/${STORAGE_ZONE}/${REMOTE_PATH}"

# --- Validation ---
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Source directory not found: $SOURCE_DIR"
  exit 1
fi

TOTAL=$(find "$SOURCE_DIR" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.webp" -o -name "*.png" \) | wc -l | tr -d ' ')
echo "📷 Found $TOTAL images in $SOURCE_DIR"
echo "📤 Uploading to: $BASE_URL"
echo ""

# --- Upload function ---
upload_file() {
  local filepath="$1"
  local filename=$(basename "$filepath")
  local attempt=0

  while [ $attempt -lt $MAX_RETRIES ]; do
    attempt=$((attempt + 1))

    # Determine content type
    local content_type="image/jpeg"
    case "$filename" in
      *.webp) content_type="image/webp" ;;
      *.png)  content_type="image/png" ;;
    esac

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      --request PUT \
      --url "${BASE_URL}/${filename}" \
      --header "AccessKey: ${API_KEY}" \
      --header "Content-Type: ${content_type}" \
      --data-binary "@${filepath}" \
      --max-time 60)

    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
      echo "  ✅ ${filename}"
      return 0
    fi

    echo "  ⚠️  ${filename} (HTTP $HTTP_CODE, attempt $attempt/$MAX_RETRIES)"
    sleep $((attempt * 2))
  done

  echo "  ❌ FAILED: ${filename} after $MAX_RETRIES attempts"
  return 1
}

export -f upload_file
export BASE_URL API_KEY MAX_RETRIES

# --- Run uploads ---
FAILED=0
UPLOADED=0

echo "🚀 Starting upload ($PARALLEL_UPLOADS parallel)..."
echo ""

find "$SOURCE_DIR" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.webp" -o -name "*.png" \) -print0 | \
  xargs -0 -P "$PARALLEL_UPLOADS" -I {} bash -c 'upload_file "$@"' _ {} || FAILED=$?

echo ""
echo "============================================"
echo "✅ Upload complete!"
echo "   Total files: $TOTAL"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Verify at: https://dash.bunny.net/storage"
echo "  2. Your CDN URL: https://sidequest-photos.b-cdn.net/photowall/"
echo "  3. Set up CNAME: images.sidequest.me → sidequest-photos.b-cdn.net"
