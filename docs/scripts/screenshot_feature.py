#!/usr/bin/env python3
"""
SideQuest.me — Feature Screenshot Helper

Fetches a live page, extracts the first matching element (or whole page),
renders it to PNG using WeasyPrint + PyMuPDF. No browser required.

Usage:
  python screenshot_feature.py \
    --url https://sidequest.me/sophie/thoughts \
    --selector article \
    --out /path/to/output.png \
    [--count 2]          # render first N matching elements (default: 1)
    [--width 720]        # viewport width in px (default: 720)

Requirements:
  pip install requests weasyprint pymupdf pillow --break-system-packages
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests --break-system-packages", file=sys.stderr)
    sys.exit(1)

try:
    from weasyprint import HTML
except ImportError:
    print("ERROR: weasyprint not installed. Run: pip install weasyprint --break-system-packages", file=sys.stderr)
    sys.exit(1)

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: pymupdf not installed. Run: pip install pymupdf --break-system-packages", file=sys.stderr)
    sys.exit(1)

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: pillow not installed. Run: pip install pillow --break-system-packages", file=sys.stderr)
    sys.exit(1)


# ── CSS variable defaults (dark theme) ───────────────────────────────────────

DARK_THEME_VARS = """
:root, * {
  --bg-base: #111111;
  --bg-card: #1e1e1e;
  --bg-raised: #242424;
  --ink: #f0edd8;
  --ink-muted: #9a9a8a;
  --border: #2a2a2a;
  --orange: #c47c7c;
  --green: #5aaa7e;
  --blue: #7ab8f5;
  --purple: #a07ac4;
  --yellow: #c4a07a;
  --red: #c47c7c;
}
"""


def fetch_page(url: str) -> tuple[str, str]:
    """Fetch page HTML and return (html, base_url)."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; SidequestScreenshotter/1.0)"}
    resp = requests.get(url, timeout=20, headers=headers)
    resp.raise_for_status()
    return resp.text, url


def find_css_url(page_html: str, base_url: str) -> str | None:
    """Find the main Next.js CSS bundle URL."""
    matches = re.findall(r'/_next/static/[^\s"\'\\]+\.css', page_html)
    if matches:
        from urllib.parse import urlparse
        parsed = urlparse(base_url)
        root = f"{parsed.scheme}://{parsed.netloc}"
        return root + matches[0]
    return None


def fetch_css(css_url: str) -> str:
    if not css_url:
        return ""
    try:
        return requests.get(css_url, timeout=15).text
    except Exception:
        return ""


def extract_elements(page_html: str, tag: str, count: int) -> list[str]:
    """
    Extract the first `count` occurrences of <tag ...>...</tag> from the page.
    Uses a simple regex — works for non-nested tags at this depth.
    """
    # Match opening tag with any attributes, then content, then closing tag
    # This handles nested same-tags by being greedy from opening to last closing
    pattern = rf'(<{tag}[\s>][^<]*(?:<(?!/{tag})[^<]*)*(?:</{tag}>)?)'

    # Simpler: just find outermost tag blocks
    results = []
    pos = 0
    while len(results) < count and pos < len(page_html):
        start = page_html.find(f'<{tag}', pos)
        if start == -1:
            break
        # Find matching closing tag (accounting for nesting)
        depth = 0
        i = start
        while i < len(page_html):
            if page_html[i:].startswith(f'<{tag}'):
                depth += 1
                i += len(tag) + 1
            elif page_html[i:].startswith(f'</{tag}>'):
                depth -= 1
                if depth == 0:
                    end = i + len(tag) + 3  # len('</') + tag + '>'
                    results.append(page_html[start:end])
                    pos = end
                    break
                i += len(tag) + 3
            else:
                i += 1
        else:
            break
    return results


def autocrop(img: "Image.Image", bg_threshold: int = 240, padding: int = 24) -> "Image.Image":
    """Crop white margins from a PIL image."""
    arr = np.array(img)
    is_light = np.all(arr[:, :, :3] > bg_threshold, axis=2)

    row_is_light = is_light.mean(axis=1) > 0.97
    col_is_light = is_light.mean(axis=0) > 0.97

    rows = np.where(~row_is_light)[0]
    cols = np.where(~col_is_light)[0]

    if len(rows) == 0 or len(cols) == 0:
        return img

    y0 = max(0, rows[0] - padding)
    y1 = min(img.height, rows[-1] + padding)
    x0 = max(0, cols[0] - padding)
    x1 = min(img.width, cols[-1] + padding)
    return img.crop((x0, y0, x1, y1))


def render_to_png(
    elements_html: str,
    css: str,
    base_url: str,
    out_path: str,
    width: int = 720,
) -> None:
    """Render HTML elements to a PNG file."""
    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{css}
{DARK_THEME_VARS}
html, body {{
  background: #111;
  padding: 28px;
  width: {width}px;
}}
</style>
</head>
<body>
<div style="max-width:{width - 56}px">
{elements_html}
</div>
</body>
</html>"""

    pdf_bytes = HTML(string=full_html, base_url=base_url).write_pdf()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    pix.save(out_path)

    # Auto-crop white margins
    img = Image.open(out_path)
    cropped = autocrop(img)
    cropped.save(out_path)
    print(f"Screenshot saved: {out_path} ({cropped.width}×{cropped.height}px)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Screenshot a live feature to PNG.")
    parser.add_argument("--url", required=True, help="URL to fetch (public, no auth required)")
    parser.add_argument("--selector", default="article", help="HTML tag to extract (default: article)")
    parser.add_argument("--out", required=True, help="Output PNG file path")
    parser.add_argument("--count", type=int, default=1, help="Number of elements to render (default: 1)")
    parser.add_argument("--width", type=int, default=720, help="Render width in px (default: 720)")
    args = parser.parse_args()

    print(f"Fetching {args.url} …")
    page_html, base_url = fetch_page(args.url)

    css_url = find_css_url(page_html, base_url)
    css = fetch_css(css_url) if css_url else ""
    print(f"CSS: {len(css)} chars from {css_url or '(none)'}")

    elements = extract_elements(page_html, args.selector, args.count)
    print(f"Found {len(elements)} <{args.selector}> element(s)")
    if not elements:
        print("ERROR: No matching elements found. Check --selector and --url.", file=sys.stderr)
        sys.exit(1)

    combined = "\n".join(elements)
    render_to_png(combined, css, base_url, args.out, args.width)


if __name__ == "__main__":
    main()
