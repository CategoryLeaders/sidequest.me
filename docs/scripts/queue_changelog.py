#!/usr/bin/env python3
"""
SideQuest.me — Changelog Queue Helper

Adds a feature entry to the pending changelog queue.
Run this immediately after deploying a feature to live.

Usage:
  python queue_changelog.py \
    --description "Unified card design system across all feed card types" \
    --screenshot /path/to/screenshot.png \
    --ticket SQ.S-W-2603-0010 \
    --subdomain www.sidequest.me

Arguments:
  --description   Human-readable description of the feature/change (required)
  --screenshot    Path to a screenshot image (PNG). Optional — omit if no UI change.
  --ticket        Asana ticket ID, e.g. SQ.S-W-2603-0010 (optional)
  --subdomain     Which subdomain the change applies to (default: www.sidequest.me)

The entry is saved as a JSON file + optional PNG in docs/changelog-queue/pending/.
The midnight job (post_daily_changelog.py) picks these up and posts them to the feed.
"""

import argparse
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

QUEUE_DIR = Path(__file__).parent.parent / "changelog-queue" / "pending"


def slugify(text: str, max_len: int = 40) -> str:
    text = text.lower()[:max_len]
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def main() -> None:
    parser = argparse.ArgumentParser(description="Add a changelog entry to the queue.")
    parser.add_argument("--description", required=True, help="Human-readable feature description")
    parser.add_argument("--screenshot", default=None, help="Path to screenshot PNG (optional)")
    parser.add_argument("--ticket", default="", help="Asana ticket ID (optional)")
    parser.add_argument("--subdomain", default="www.sidequest.me", help="Affected subdomain")
    args = parser.parse_args()

    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    slug = slugify(args.description)
    base_name = f"{ts}_{slug}"

    screenshot_filename = None
    if args.screenshot:
        src = Path(args.screenshot).expanduser().resolve()
        if not src.exists():
            print(f"ERROR: Screenshot not found: {src}", file=sys.stderr)
            sys.exit(1)
        ext = src.suffix.lower() or ".png"
        screenshot_filename = f"{base_name}{ext}"
        dest = QUEUE_DIR / screenshot_filename
        shutil.copy2(src, dest)
        print(f"Screenshot copied → {dest}")

    entry = {
        "id": base_name,
        "queued_at": datetime.now(timezone.utc).isoformat(),
        "subdomain": args.subdomain,
        "ticket": args.ticket,
        "description": args.description,
        "screenshot": screenshot_filename,
    }

    json_path = QUEUE_DIR / f"{base_name}.json"
    with open(json_path, "w") as f:
        json.dump(entry, f, indent=2)

    print(f"Queued  → {json_path}")
    print(f"  id         : {base_name}")
    print(f"  description: {args.description}")
    if args.ticket:
        print(f"  ticket     : {args.ticket}")
    print(f"  subdomain  : {args.subdomain}")
    if screenshot_filename:
        print(f"  screenshot : {screenshot_filename}")
    else:
        print(f"  screenshot : (none)")


if __name__ == "__main__":
    main()
