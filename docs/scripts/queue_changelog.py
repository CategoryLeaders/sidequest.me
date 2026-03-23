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

Alternatively, pass --url to auto-capture a screenshot from the live site (no browser needed):
  python queue_changelog.py \
    --description "New card design system" \
    --url https://sidequest.me/sophie/thoughts \
    --selector article \
    --ticket SQ.S-W-2603-0086
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

QUEUE_DIR = Path(__file__).parent.parent / "changelog-queue" / "pending"
SCRIPTS_DIR = Path(__file__).parent


def slugify(text: str, max_len: int = 40) -> str:
    text = text.lower()[:max_len]
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def auto_screenshot(url: str, selector: str, out_path: str) -> bool:
    """Call screenshot_feature.py to render the live page element to PNG."""
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPTS_DIR / "screenshot_feature.py"),
            "--url", url,
            "--selector", selector,
            "--out", out_path,
            "--count", "1",
        ],
        capture_output=False,
    )
    return result.returncode == 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Add a changelog entry to the queue.")
    parser.add_argument("--description", required=True, help="Human-readable feature description")
    parser.add_argument("--screenshot", default=None, help="Path to an existing screenshot PNG (optional)")
    parser.add_argument("--url", default=None, help="Live URL to auto-screenshot (alternative to --screenshot)")
    parser.add_argument("--selector", default="article", help="CSS tag to screenshot when using --url (default: article)")
    parser.add_argument("--ticket", default="", help="Asana ticket ID (optional)")
    parser.add_argument("--subdomain", default="www.sidequest.me", help="Affected subdomain")
    args = parser.parse_args()

    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    slug = slugify(args.description)
    base_name = f"{ts}_{slug}"

    screenshot_filename = None

    if args.url and not args.screenshot:
        # Auto-capture from live URL
        tmp_png = str(QUEUE_DIR / f"{base_name}.png")
        print(f"Auto-capturing screenshot from {args.url} …")
        ok = auto_screenshot(args.url, args.selector, tmp_png)
        if ok and Path(tmp_png).exists():
            screenshot_filename = f"{base_name}.png"
            print(f"Screenshot captured → {tmp_png}")
        else:
            print("WARNING: Screenshot capture failed — queuing without image.", file=sys.stderr)

    elif args.screenshot:
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
