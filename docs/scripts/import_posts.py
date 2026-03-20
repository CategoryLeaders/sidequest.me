#!/usr/bin/env python3
"""
SideQuest.me — One-time post import script [SQ.S-W-2603-0070]

Imports posts + comments from Facebook Page exports and Telegram exports
into the microblog_posts table via Supabase service role.

Usage:
  python import_posts.py \
    --source facebook \
    --file ~/facebook-export.zip \
    --config known_accounts.json \
    --supabase-url https://xxx.supabase.co \
    --supabase-key sbp_xxx \
    --profile-id <uuid> \
    --visibility public \
    --dry-run

Sources:
  facebook   — ZIP from Facebook's "Download Your Information"
  telegram_channel — JSON (result.json from Telegram Desktop export)
  telegram_group   — JSON (result.json from Telegram Desktop export, with threads)

Flags:
  --source          Source platform (required)
  --file            Path to export file (required)
  --config          Path to known_accounts.json (optional)
  --supabase-url    Supabase project URL (required)
  --supabase-key    Supabase service role key (required)
  --profile-id      Profile UUID to import into (required)
  --visibility      Visibility for imported posts (default: public)
  --from            Only import posts after this date (ISO 8601)
  --to              Only import posts before this date (ISO 8601)
  --dry-run         Preview what would be imported without writing
"""

import argparse
import hashlib
import json
import logging
import os
import random
import string
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase", file=sys.stderr)
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("import.log", mode="a"),
    ],
)
log = logging.getLogger("import")

# ─── Short ID generation ────────────────────────────────────────────────────

CHARS = string.ascii_lowercase + string.digits


def generate_short_id() -> str:
    return "".join(random.choices(CHARS, k=4))


# ─── Known accounts matching ────────────────────────────────────────────────


class AccountMatcher:
    def __init__(self, config_path: Optional[str]):
        self.profile_id: Optional[str] = None
        self.known_accounts: list[dict] = []
        if config_path and os.path.exists(config_path):
            with open(config_path) as f:
                data = json.load(f)
            self.profile_id = data.get("profile_id")
            self.known_accounts = data.get("known_accounts", [])
            log.info(f"Loaded {len(self.known_accounts)} known accounts from config")

    def match(self, name: str, facebook_id: Optional[str] = None) -> tuple[Optional[str], str]:
        """Returns (user_id_or_none, match_type: 'exact'|'name'|'ambiguous'|'anonymous')"""
        if not self.profile_id:
            return None, "anonymous"

        # 1. Facebook ID exact match
        if facebook_id:
            for acct in self.known_accounts:
                if acct.get("facebook_id") == facebook_id:
                    return self.profile_id, "exact"

        # 2. Name match (case-insensitive, trimmed)
        name_lower = name.strip().lower()
        matches = [
            a for a in self.known_accounts if a.get("name", "").strip().lower() == name_lower
        ]
        if len(matches) == 1:
            return self.profile_id, "name"
        elif len(matches) > 1:
            log.warning(f"[AMBIGUOUS] Multiple name matches for '{name}'")
            return self.profile_id, "ambiguous"

        return None, "anonymous"


# ─── Content hash for dedup ─────────────────────────────────────────────────


def content_hash(body: str, source_created_at: str) -> str:
    return hashlib.sha256(f"{body}:{source_created_at}".encode()).hexdigest()[:16]


# ─── Facebook parser ────────────────────────────────────────────────────────


def parse_facebook(file_path: str, date_from: Optional[str], date_to: Optional[str]) -> list[dict]:
    posts = []
    with zipfile.ZipFile(file_path, "r") as zf:
        # Try common paths
        for json_path in ["posts/your_posts_1.json", "your_posts_1.json",
                          "pages/your_pages_posts.json"]:
            try:
                data = json.loads(zf.read(json_path))
            except (KeyError, FileNotFoundError):
                continue

            for item in data if isinstance(data, list) else data.get("data", data.get("posts", [])):
                post = parse_facebook_post(item, date_from, date_to)
                if post:
                    posts.append(post)
            break
        else:
            # Scan for any JSON files with "post" in the name
            for name in zf.namelist():
                if name.endswith(".json") and "post" in name.lower():
                    try:
                        data = json.loads(zf.read(name))
                        items = data if isinstance(data, list) else data.get("data", [])
                        for item in items:
                            post = parse_facebook_post(item, date_from, date_to)
                            if post:
                                posts.append(post)
                    except (json.JSONDecodeError, KeyError):
                        continue

    log.info(f"Parsed {len(posts)} Facebook posts")
    return posts


def parse_facebook_post(item: dict, date_from: Optional[str], date_to: Optional[str]) -> Optional[dict]:
    timestamp = item.get("timestamp")
    if not timestamp:
        return None

    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    iso = dt.isoformat()

    if date_from and iso < date_from:
        return None
    if date_to and iso > date_to:
        return None

    # Extract body text
    body = ""
    for d in item.get("data", []):
        if "post" in d:
            body = d["post"]
        elif "update_timestamp" in d:
            continue

    if not body and not item.get("attachments"):
        return None  # empty post

    # Extract images
    images = []
    for att in item.get("attachments", []):
        for ad in att.get("data", []):
            if "media" in ad:
                media = ad["media"]
                uri = media.get("uri", "")
                if uri:
                    images.append({"local_path": uri, "description": media.get("description", "")})

    # Extract link
    link_url = None
    for att in item.get("attachments", []):
        for ad in att.get("data", []):
            if "external_context" in ad:
                link_url = ad["external_context"].get("url")

    # Comments
    comments = []
    for comment in item.get("comments", []):
        comments.append({
            "body": comment.get("comment", ""),
            "author_name": comment.get("author", "Facebook User"),
            "timestamp": comment.get("timestamp"),
        })

    return {
        "body": body,
        "images": images,
        "link_url": link_url,
        "source": "facebook_import",
        "source_created_at": iso,
        "source_url": None,
        "comments": comments,
        "content_hash": content_hash(body, iso),
    }


# ─── Telegram parser ────────────────────────────────────────────────────────


def parse_telegram(
    file_path: str,
    source_type: str,
    date_from: Optional[str],
    date_to: Optional[str],
) -> list[dict]:
    with open(file_path) as f:
        data = json.load(f)

    messages = data.get("messages", [])
    posts = []

    for msg in messages:
        post = parse_telegram_message(msg, source_type, date_from, date_to)
        if post:
            posts.append(post)

    log.info(f"Parsed {len(posts)} Telegram posts")
    return posts


def parse_telegram_message(
    msg: dict, source_type: str, date_from: Optional[str], date_to: Optional[str]
) -> Optional[dict]:
    if msg.get("type") != "message":
        return None

    date_str = msg.get("date", "")
    if not date_str:
        return None

    if date_from and date_str < date_from:
        return None
    if date_to and date_str > date_to:
        return None

    # Extract body
    text_parts = msg.get("text", "")
    if isinstance(text_parts, list):
        body = ""
        for part in text_parts:
            if isinstance(part, str):
                body += part
            elif isinstance(part, dict):
                body += part.get("text", "")
    else:
        body = str(text_parts)

    if not body.strip() and not msg.get("photo") and not msg.get("file"):
        return None

    # Images
    images = []
    if msg.get("photo"):
        images.append({"local_path": msg["photo"], "description": ""})
    if msg.get("file") and msg.get("mime_type", "").startswith("image/"):
        images.append({"local_path": msg["file"], "description": ""})

    # Link
    link_url = None
    if isinstance(text_parts, list):
        for part in text_parts:
            if isinstance(part, dict) and part.get("type") == "link":
                link_url = part.get("text")

    # Telegram group threads (replies)
    comments = []
    if source_type == "telegram_group_import":
        for reply in msg.get("replies", []):
            reply_text = reply.get("text", "")
            if isinstance(reply_text, list):
                reply_text = "".join(
                    p if isinstance(p, str) else p.get("text", "") for p in reply_text
                )
            comments.append({
                "body": str(reply_text),
                "author_name": reply.get("from", "Telegram User"),
                "timestamp": reply.get("date"),
            })

    return {
        "body": body.strip(),
        "images": images,
        "link_url": link_url,
        "source": source_type,
        "source_created_at": date_str,
        "source_url": None,
        "comments": comments,
        "content_hash": content_hash(body.strip(), date_str),
    }


# ─── Supabase uploader ──────────────────────────────────────────────────────


class Importer:
    def __init__(
        self,
        supabase: Client,
        profile_id: str,
        visibility: str,
        matcher: AccountMatcher,
        dry_run: bool,
        source_dir: str = "",
    ):
        self.supabase = supabase
        self.profile_id = profile_id
        self.visibility = visibility
        self.matcher = matcher
        self.dry_run = dry_run
        self.source_dir = source_dir
        self.stats = {"posts": 0, "comments": 0, "images": 0, "skipped_dupes": 0}

    def import_posts(self, posts: list[dict]) -> None:
        for post in posts:
            self._import_post(post)

        log.info(f"Import complete: {self.stats}")

    def _import_post(self, post: dict) -> None:
        # Dedup check
        existing = (
            self.supabase.table("microblog_posts")
            .select("id")
            .eq("profile_id", self.profile_id)
            .eq("body", post["body"][:200])
            .execute()
        )
        if existing.data:
            self.stats["skipped_dupes"] += 1
            log.info(f"[SKIP] Duplicate: {post['body'][:60]}...")
            return

        if self.dry_run:
            log.info(f"[DRY-RUN] Would import: {post['body'][:80]}...")
            self.stats["posts"] += 1
            return

        short_id = generate_short_id()

        # Upload images
        image_records = []
        for img in post.get("images", []):
            url = self._upload_image(img["local_path"])
            if url:
                image_records.append({"url": url, "alt": img.get("description", "")})
                self.stats["images"] += 1

        # Insert post
        result = (
            self.supabase.table("microblog_posts")
            .insert(
                {
                    "profile_id": self.profile_id,
                    "short_id": short_id,
                    "body": post["body"],
                    "images": image_records,
                    "link_url": post.get("link_url"),
                    "tags": [],
                    "visibility": self.visibility,
                    "status": "published",
                    "source": post["source"],
                    "source_created_at": post["source_created_at"],
                    "source_url": post.get("source_url"),
                    "published_at": post["source_created_at"],
                    "reactions_enabled": True,
                    "comments_enabled": True,
                }
            )
            .execute()
        )

        post_id = result.data[0]["id"] if result.data else None
        self.stats["posts"] += 1
        log.info(f"[OK] Imported post {short_id}: {post['body'][:60]}...")

        # Import comments
        if post_id and post.get("comments"):
            self._import_comments(post_id, post["comments"])

    def _import_comments(self, post_id: str, comments: list[dict]) -> None:
        for comment in comments:
            if not comment.get("body"):
                continue

            # Match commenter
            user_id, match_type = self.matcher.match(comment.get("author_name", ""))

            anonymous_name = None
            commenter_type = "live"

            if match_type == "anonymous":
                commenter_type = "anonymous_import"
                source = comment.get("source", "")
                if "facebook" in str(source).lower():
                    anonymous_name = comment.get("author_name", "Facebook User")
                else:
                    anonymous_name = comment.get("author_name", "Telegram User")
                user_id = None
            elif match_type == "ambiguous":
                commenter_type = "anonymous_import"
                anonymous_name = f"{comment.get('author_name', 'Unknown')} [AMBIGUOUS]"
                user_id = None

            ts = comment.get("timestamp")
            created_at = None
            if isinstance(ts, int):
                created_at = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
            elif isinstance(ts, str):
                created_at = ts

            self.supabase.table("microblog_comments").insert(
                {
                    "post_id": post_id,
                    "user_id": user_id,
                    "anonymous_name": anonymous_name,
                    "body": comment["body"][:500],
                    "commenter_type": commenter_type,
                    "status": "visible",
                    **({"created_at": created_at} if created_at else {}),
                }
            ).execute()

            self.stats["comments"] += 1

    def _upload_image(self, local_path: str) -> Optional[str]:
        """Upload a local image to Supabase Storage and return the public URL."""
        full_path = os.path.join(self.source_dir, local_path) if self.source_dir else local_path

        if not os.path.exists(full_path):
            log.warning(f"[SKIP] Image not found: {full_path}")
            return None

        ext = Path(full_path).suffix.lower()
        if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            log.warning(f"[SKIP] Unsupported image format: {ext}")
            return None

        storage_path = f"{self.profile_id}/imports/{generate_short_id()}{ext}"

        with open(full_path, "rb") as f:
            self.supabase.storage.from_("microblog-media").upload(storage_path, f.read())

        public_url = self.supabase.storage.from_("microblog-media").get_public_url(storage_path)
        return public_url


# ─── Main ────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="SideQuest.me import script")
    parser.add_argument("--source", required=True, choices=["facebook", "telegram_channel", "telegram_group"])
    parser.add_argument("--file", required=True, help="Path to export file")
    parser.add_argument("--config", help="Path to known_accounts.json")
    parser.add_argument("--supabase-url", required=True)
    parser.add_argument("--supabase-key", required=True, help="Service role key")
    parser.add_argument("--profile-id", required=True, help="Profile UUID")
    parser.add_argument("--visibility", default="public", choices=["public", "unlisted", "private"])
    parser.add_argument("--from", dest="date_from", help="Import posts after this date (ISO 8601)")
    parser.add_argument("--to", dest="date_to", help="Import posts before this date (ISO 8601)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    log.info(f"Starting import: source={args.source}, file={args.file}, dry_run={args.dry_run}")

    # Parse export
    if args.source == "facebook":
        posts = parse_facebook(args.file, args.date_from, args.date_to)
        source_dir = ""
    elif args.source in ("telegram_channel", "telegram_group"):
        posts = parse_telegram(
            args.file,
            f"{args.source}_import",
            args.date_from,
            args.date_to,
        )
        source_dir = str(Path(args.file).parent)
    else:
        log.error(f"Unknown source: {args.source}")
        sys.exit(1)

    if not posts:
        log.info("No posts found to import")
        return

    log.info(f"Found {len(posts)} posts to import")

    # Connect to Supabase
    supabase = create_client(args.supabase_url, args.supabase_key)

    matcher = AccountMatcher(args.config)
    importer = Importer(
        supabase=supabase,
        profile_id=args.profile_id,
        visibility=args.visibility,
        matcher=matcher,
        dry_run=args.dry_run,
        source_dir=source_dir,
    )

    importer.import_posts(posts)
    log.info(f"Import stats: {importer.stats}")


if __name__ == "__main__":
    main()
