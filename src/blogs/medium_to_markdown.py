#!/usr/bin/env python3
"""
medium2md.py — Convert a Medium article URL into a clean Markdown file.

Features
- Extracts the main article body with readability-lxml (falls back to <article>/<main>/<body>).
- Converts HTML → Markdown (fenced code blocks, proper lists/links).
- Captures title, author, and published date → optional YAML front matter.
- Optionally downloads images and rewrites image links to local assets.
- Strips common tracking query params (utm_*, source, sk, ref, etc.).
- Includes a lightweight self-test suite (no network) with: `python medium2md.py --self-test`
- Friendly CLI: if no URL is supplied, shows help & examples instead of throwing a stack trace.

Usage
    python medium2md.py "https://medium.com/some-article" -o out.md --images --assets-dir assets

Install deps
    pip install requests readability-lxml beautifulsoup4 markdownify python-dateutil

Note: Some Medium pages require the JSON format. This script handles normal HTML pages well.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, urljoin, urlunparse, parse_qsl, urlencode

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
try:
    from readability import Document
except Exception:  # pragma: no cover - optional dependency import guard
    Document = None  # type: ignore
from markdownify import markdownify as md

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    )
}

TRACKING_PARAMS = {
    "source",
    "sk",
    "ref",
    "gi",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
}

CODE_LANG_RE = re.compile(r"\blanguage-([a-zA-Z0-9_+-]+)\b")


# ------------------------------
# Utilities
# ------------------------------

def strip_tracking(url: str) -> str:
    """Remove common tracking query params from a URL."""
    try:
        parsed = urlparse(url)
        if not parsed.query:
            return url
        q = [
            (k, v)
            for (k, v) in parse_qsl(parsed.query, keep_blank_values=True)
            if k not in TRACKING_PARAMS and not k.startswith("utm_")
        ]
        new_query = urlencode(q)
        cleaned = urlunparse(
            (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
        )
        return cleaned
    except Exception:
        return url


def fetch(url: str) -> tuple[str, str]:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    ct = resp.headers.get("content-type", "").lower()
    encoding = resp.apparent_encoding or "utf-8"
    resp.encoding = encoding
    return resp.text, ct


def select_article_html(html: str, base_url: str) -> tuple[str, dict]:
    """Return (article_html, meta) with meta keys: title, author, published, base_url."""
    article_html = None
    title = ""

    soup = BeautifulSoup(html, "html.parser")

    # Prefer Readability when available
    if Document is not None:
        try:
            doc = Document(html)
            article_html = doc.summary(html_partial=True)
            title = (doc.short_title() or "").strip()
        except Exception:
            article_html = None

    # Meta title if missing or low quality
    if not title or len(title) < 3:
        t = soup.find("meta", property="og:title") or soup.find("title")
        if t:
            title = t.get("content", "").strip() or t.text.strip()

    # Medium usually has <meta name="author" content="...">
    author = None
    m_author = soup.find("meta", attrs={"name": "author"})
    if m_author and m_author.get("content"):
        author = m_author["content"].strip()
    else:
        # Try schema.org
        au = soup.select_one('[itemprop="author"], [rel="author"]')
        if au:
            author = au.get("content") or au.get_text(strip=True)

    # Published date
    published = None
    # Try time tag
    t = soup.find("time")
    if t and (t.get("datetime") or t.text.strip()):
        val = t.get("datetime") or t.text.strip()
        try:
            published = dateparser.parse(val).date().isoformat()
        except Exception:
            published = None
    if not published:
        for key in ("article:published_time", "og:published_time"):
            m = soup.find("meta", property=key)
            if m and m.get("content"):
                try:
                    published = dateparser.parse(m["content"]).date().isoformat()
                    break
                except Exception:
                    pass

    # Fallback: try to find <article>, then <main>, else <body>
    if not article_html or len(BeautifulSoup(article_html, "html.parser").get_text(strip=True)) < 100:
        art = soup.find("article")
        if art:
            article_html = str(art)
        else:
            main = soup.find("main")
            if main:
                article_html = str(main)
            else:
                body = soup.find("body")
                article_html = str(body) if body else html

    meta = {
        "title": title or "Untitled",
        "author": author,
        "published": published,
        "base_url": base_url,
    }
    return article_html, meta


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def guess_filename_from_url(url: str, idx: int) -> str:
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)
    if not name:
        name = f"image_{idx}"
    if "." not in name:
        # extension may be missing; add png as generic default
        name += ".png"
    return name


def extract_img_src(tag) -> str | None:
    """Find the best src for an <img> (handles data-src/srcset)."""
    candidates = [
        tag.get("src"),
        tag.get("data-src"),
        tag.get("data-original"),
    ]
    srcset = tag.get("srcset") or tag.get("data-srcset")
    if not any(candidates) and srcset:
        # take the highest density candidate (last in srcset usually)
        try:
            last = srcset.split(",")[-1].strip().split(" ")[0]
            candidates.append(last)
        except Exception:
            pass
    for c in candidates:
        if c and c.strip():
            return c.strip()
    return None


def download_and_rewrite_images(article_html: str, base_url: str, assets_dir: Path) -> tuple[str, list[Path]]:
    soup = BeautifulSoup(article_html, "html.parser")
    downloaded: list[Path] = []
    ensure_dir(assets_dir)

    for idx, img in enumerate(soup.find_all("img"), start=1):
        src = extract_img_src(img)
        if not src:
            continue
        abs_url = urljoin(base_url, src)
        abs_url = strip_tracking(abs_url)
        try:
            r = requests.get(abs_url, headers=HEADERS, timeout=30)
            r.raise_for_status()
            # Try to preserve extension from content-type if unknown
            filename = guess_filename_from_url(abs_url, idx)
            # If no extension or generic, refine from content-type
            ct = r.headers.get("content-type", "").lower()
            if (filename.endswith(".png") or filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".gif")) is False:
                if "jpeg" in ct and not filename.endswith(".jpg"):
                    filename += ".jpg"
                elif "png" in ct and not filename.endswith(".png"):
                    filename += ".png"
                elif "gif" in ct and not filename.endswith(".gif"):
                    filename += ".gif"
            out_path = assets_dir / filename
            with open(out_path, "wb") as f:
                f.write(r.content)
            downloaded.append(out_path)
            # rewrite src to local relative path
            img["src"] = str(Path(assets_dir.name) / filename)
            for attr in ["srcset", "data-src", "data-srcset", "data-original"]:
                if img.has_attr(attr):
                    del img[attr]
        except Exception:
            # If download fails, keep original src
            continue

    return str(soup), downloaded


def normalize_codeblocks(html: str) -> str:
    """Wrap <pre><code class="language-xyz"> into fenced code blocks for markdownify."""
    soup = BeautifulSoup(html, "html.parser")

    for pre in soup.find_all("pre"):
        code = pre.find("code")
        if code:
            classes = " ".join(code.get("class", []))
            lang = None
            m = CODE_LANG_RE.search(classes)
            if m:
                lang = m.group(1)
            contents = code.get_text()
            fence = f"```{lang or ''}\n{contents}\n```"
            pre.replace_with(soup.new_string(fence))
        else:
            contents = pre.get_text()
            fence = f"```\n{contents}\n```"
            pre.replace_with(soup.new_string(fence))

    return str(soup)


def _preclean_html(html: str) -> str:
    """Remove unsafe/irrelevant tags before markdownify so we can avoid
    passing both `strip` and `convert` (which raises ValueError in markdownify).
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag_name in ("script", "style", "noscript"):
        for t in soup.find_all(tag_name):
            t.decompose()
    return str(soup)


def html_to_markdown(html: str) -> str:
    """Convert HTML to Markdown with sane defaults.

    Note: markdownify raises `ValueError` if both `strip` and `convert` are
    passed together. We pre-clean unwanted tags instead, and only specify
    formatting options here.
    """
    cleaned = _preclean_html(html)
    return md(
        cleaned,
        heading_style="ATX",
        bullets="*",
    )


def _yaml_escape(s: str) -> str:
    """Escape double quotes for safe YAML string output inside double quotes."""
    return s.replace('"', "'")


def build_front_matter(meta: dict, include_yaml: bool) -> str:
    if not include_yaml:
        return ""
    lines = ["---"]
    title = meta.get('title', 'Untitled') or 'Untitled'
    lines.append(f"title: \"{_yaml_escape(title)}\"")
    if meta.get("author"):
        author = meta['author']
        lines.append(f"author: \"{_yaml_escape(author)}\"")
    if meta.get("published"):
        lines.append(f"date: {meta['published']}")
    lines.append(f"source: {strip_tracking(meta.get('base_url',''))}")
    lines.append("---\n")
    return "\n".join(lines)


def convert(url: str, out_path: Path, download_images: bool, assets_dir: Path, include_yaml: bool) -> None:
    html, _ = fetch(url)
    article_html, meta = select_article_html(html, url)

    # Clean/normalize before conversion
    if download_images:
        article_html, downloaded = download_and_rewrite_images(article_html, url, assets_dir)
        if downloaded:
            print(f"Downloaded {len(downloaded)} images to {assets_dir}")

    article_html = normalize_codeblocks(article_html)

    md_body = html_to_markdown(article_html)

    # Post-process: collapse >3 blank lines, trim spaces
    md_body = re.sub(r"\n{3,}", "\n\n", md_body).strip() + "\n"

    fm = build_front_matter(meta, include_yaml)
    title_h1 = f"# {meta.get('title','Untitled')}\n\n" if not include_yaml else ""

    final_md = f"{fm}{title_h1}{md_body}"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(final_md, encoding="utf-8")
    print(f"Saved → {out_path}")


# ------------------------------
# Self Tests (no network)
# ------------------------------

def _run_self_tests() -> int:
    """Minimal tests that don't require network access."""
    import textwrap

    # strip_tracking
    assert strip_tracking("https://x.y/z?a=1&utm_source=foo&b=2") == "https://x.y/z?a=1&b=2"
    assert strip_tracking("https://x.y/z?utm_medium=x") == "https://x.y/z"

    # normalize_codeblocks → should produce fenced code
    html = '<pre><code class="language-python">print("hi")\n</code></pre>'
    norm = normalize_codeblocks(html)
    assert "```python" in norm and "print(" in norm

    # build_front_matter escaping
    meta = {"title": 'He said "Hello"', "author": 'A "Name"', "published": "2024-05-01", "base_url": "https://m/abc?utm_source=x"}
    fm = build_front_matter(meta, include_yaml=True)
    assert 'title: "He said ' in fm and 'author: "A ' in fm and 'source: https://m/abc' in fm

    # html_to_markdown basic
    md_out = html_to_markdown("<h1>Title</h1><p>Para</p>")
    assert "# Title" in md_out and "Para" in md_out

    # select_article_html fallback path
    sample_html = textwrap.dedent(
        """
        <html><head><title>T</title><meta name="author" content="Auth"/></head>
        <body><main><p>hello world</p></main></body></html>
        """
    )
    art, meta2 = select_article_html(sample_html, "https://example.com/x")
    assert "hello world" in art and meta2["author"] == "Auth"

    # NEW: build_front_matter when author/date missing → omit lines, no placeholders
    fm2 = build_front_matter({"title": "T", "base_url": "https://e/x"}, include_yaml=True)
    assert "author:" not in fm2 and "date:" not in fm2

    # NEW: code fence without language
    norm2 = normalize_codeblocks("<pre>echo hi</pre>")
    assert "```\n" in norm2 and "echo hi" in norm2

    # NEW: pre-clean removes script/style/noscript without using markdownify's strip
    dirty = "<h2>Head</h2><script>alert(1)</script><style>h2{}</style><noscript>no</noscript><p>Body</p>"
    md_clean = html_to_markdown(dirty)
    assert "alert(1)" not in md_clean and "no" not in md_clean and "Body" in md_clean and "## Head" in md_clean

    print("All self tests passed.")
    return 0


# ------------------------------
# CLI
# ------------------------------

def _build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="Convert a Medium article to Markdown",
        add_help=True,
        formatter_class=argparse.RawTextHelpFormatter,
    )
    ap.add_argument("url", nargs="?", help="Medium article URL")
    ap.add_argument("-o", "--out", default=None, help="Output .md path (default: title.md)")
    ap.add_argument("--images", action="store_true", help="Download images and rewrite links")
    ap.add_argument("--assets-dir", default="assets", help="Directory for downloaded images (default: assets)")
    ap.add_argument("--no-front-matter", action="store_true", help="Do not include YAML front matter")
    ap.add_argument("--self-test", action="store_true", help="Run built-in tests and exit")
    return ap


def main(argv: list[str] | None = None) -> int:
    ap = _build_parser()
    args = ap.parse_args(argv)

    # Self-tests first
    if args.self_test:
        return _run_self_tests()

    # Friendly message instead of argparse's SystemExit when URL is missing
    if not args.url:
        sys.stderr.write(
            "Error: no URL provided.\n\n"
            "Examples:\n"
            "  python medium2md.py \"https://medium.com/@user/article\"\n"
            "  python medium2md.py \"https://medium.com/@user/article\" -o out.md --images\n"
            "  python medium2md.py --self-test\n\n"
        )
        ap.print_help(sys.stderr)
        return 2  # explicit exit code instead of raising

    # Fetch once to determine title/metadata (for default filename)
    html, _ = fetch(args.url)
    article_html, meta = select_article_html(html, args.url)

    title_slug = re.sub(r"[^a-zA-Z0-9\-]+", "-", meta.get("title", "Untitled").strip()).strip("-").lower() or "medium-article"

    out_path = Path(args.out) if args.out else Path(f"{title_slug}.md")
    assets_dir = Path(args.assets_dir)

    convert(
        url=args.url,
        out_path=out_path,
        download_images=args.images,
        assets_dir=assets_dir,
        include_yaml=not args.no_front_matter,
    )

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main([
            "https://gmongaras.medium.com/coding-a-virtual-ai-girlfriend-f951e648aa46"
        ]))
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)
