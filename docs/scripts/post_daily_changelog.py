#!/usr/bin/env python3
"""
SideQuest.me — Daily Changelog Auto-Poster

Reads all pending entries from docs/changelog-queue/pending/, uploads their
screenshots to Supabase Storage, and posts a single Changelog microblog post
to sidequest.me. Intended to run daily at midnight (UK time).

Credentials are loaded from docs/scripts/tokens.pat (sourced as shell env vars
before this script runs, OR exported into the environment).

Required env vars:
  SUPABASE_SERVICE_ROLE_KEY   Service role JWT for Supabase
  SUPABASE_PROFILE_ID         Sophie's profile UUID (81d66bdd-c62f-49a1-b089-a5cbb64b8437)

Optional env vars:
  SUPABASE_URL                Defaults to https://loawjmjuwrjjgmedswro.supabase.co
  DRY_RUN                     Set to "1" to print what would be posted without writing

Usage (manual run):
  source docs/scripts/tokens.pat && python docs/scripts/post_daily_changelog.py
  source docs/scripts/tokens.pat && DRY_RUN=1 python docs/scripts/post_daily_changelog.py
"""

import json
import mimetypes
import os
import random
import string
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests --break-system-packages", file=sys.stderr)
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://loawjmjuwrjjgmedswro.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_PROFILE_ID = os.environ.get("SUPABASE_PROFILE_ID", "81d66bdd-c62f-49a1-b089-a5cbb64b8437")
DRY_RUN = os.environ.get("DRY_RUN", "0") == "1"

REPO_ROOT = Path(__file__).parent.parent.parent
QUEUE_PENDING = REPO_ROOT / "docs" / "changelog-queue" / "pending"
QUEUE_PROCESSED = REPO_ROOT / "docs" / "changelog-queue" / "processed"

# ── Helpers ───────────────────────────────────────────────────────────────────

def supabase_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def generate_short_id(length: int = 6) -> str:
    """Generate a short alphanumeric ID for the post URL."""
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=length))


def upload_image(image_path: Path) -> dict:
    """
    Upload a screenshot to Supabase Storage (photos bucket).
    Returns {"url": "...", "storage_path": "..."}.
    """
    ext = image_path.suffix.lower().lstrip(".") or "png"
    content_type = mimetypes.types_map.get(f".{ext}", "image/png")
    storage_path = f"{SUPABASE_PROFILE_ID}/changelog/{uuid.uuid4().hex}.{ext}"

    with open(image_path, "rb") as f:
        data = f.read()

    url = f"{SUPABASE_URL}/storage/v1/object/photos/{storage_path}"
    resp = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": content_type,
        },
        data=data,
    )
    resp.raise_for_status()

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/photos/{storage_path}"
    return {"url": public_url, "storage_path": storage_path}


def create_changelog_post(title: str, items: list[dict], today: str) -> dict:
    """
    Insert a changelog microblog post directly via Supabase REST API.
    Returns the created row.
    """
    body_text = "\n".join(
        f"- {item['text']}" for item in items
    )

    short_id = generate_short_id()
    payload = {
        "profile_id": SUPABASE_PROFILE_ID,
        "short_id": short_id,
        "post_type": "changelog",
        "title": title,
        "changelog_items": items,
        "body": body_text,
        "visibility": "public",
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "source": "native",
        "tags": ["changelog"],
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/microblog_posts",
        headers=supabase_headers(),
        json=payload,
    )
    resp.raise_for_status()
    rows = resp.json()
    if isinstance(rows, list) and rows:
        return rows[0]
    return {"short_id": short_id}


def archive_files(json_paths: list[Path], entries: list[dict], today: str) -> None:
    """Move processed JSON + screenshot files to processed/YYYY-MM-DD/."""
    archive_dir = QUEUE_PROCESSED / today
    archive_dir.mkdir(parents=True, exist_ok=True)

    for json_path, entry in zip(json_paths, entries):
        json_path.rename(archive_dir / json_path.name)
        if entry.get("screenshot"):
            img_path = QUEUE_PENDING / entry["screenshot"]
            if img_path.exists():
                img_path.rename(archive_dir / img_path.name)

    print(f"Archived {len(json_paths)} entries → {archive_dir}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set. Source tokens.pat first.", file=sys.stderr)
        print("  source docs/scripts/tokens.pat && python docs/scripts/post_daily_changelog.py", file=sys.stderr)
        sys.exit(1)

    # Collect pending entries (sorted by filename = chronological)
    json_files = sorted(QUEUE_PENDING.glob("*.json"))
    if not json_files:
        print("No pending changelog entries today. Skipping post.")
        sys.exit(0)

    print(f"Found {len(json_files)} pending entries.")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    title = f"Changelog — {today}"

    items: list[dict] = []
    loaded_entries: list[dict] = []

    for json_path in json_files:
        with open(json_path) as f:
            entry = json.load(f)
        loaded_entries.append(entry)

        # Build display text (prefix with ticket if present)
        text = entry["description"]
        if entry.get("ticket"):
            text = f"[{entry['ticket']}] {text}"
        if entry.get("subdomain") and entry["subdomain"] not in ("www.sidequest.me", "sidequest.me"):
            text = f"{text} ({entry['subdomain']})"

        item: dict = {"text": text}

        # Upload screenshot
        if entry.get("screenshot"):
            img_path = QUEUE_PENDING / entry["screenshot"]
            if img_path.exists():
                if DRY_RUN:
                    print(f"  [DRY RUN] Would upload: {img_path.name}")
                    item["image"] = {"url": f"https://example.com/dry-run/{img_path.name}"}
                else:
                    print(f"  Uploading: {img_path.name} … ", end="", flush=True)
                    try:
                        img_meta = upload_image(img_path)
                        item["image"] = img_meta
                        print("✓")
                    except Exception as e:
                        print(f"FAILED ({e}) — including item without image")
            else:
                print(f"  WARNING: Screenshot file not found: {img_path}")

        items.append(item)
        print(f"  + {text[:80]}")

    print()

    if DRY_RUN:
        print(f"[DRY RUN] Would post changelog '{title}' with {len(items)} items.")
        print(json.dumps({"title": title, "items": items}, indent=2))
        return

    # Post to Sidequest
    print(f"Posting '{title}' …")
    try:
        post = create_changelog_post(title, items, today)
        print(f"✓ Posted — short_id: {post.get('short_id')} | id: {post.get('id', 'unknown')}")
    except Exception as e:
        print(f"ERROR posting changelog: {e}", file=sys.stderr)
        sys.exit(1)

    # Archive
    archive_files(json_files, loaded_entries, today)
    print("Done.")


if __name__ == "__main__":
    main()
