#!/usr/bin/env python3
"""Write README.md from site/lyrics-and-chords/page.md, the one source shared with the web page.

Usage:
    python3 build_readme.py            # write README.md
    python3 build_readme.py --check    # say whether README.md is up to date (exit 1 if not); changes nothing
    python3 build_readme.py --force    # write even if README.md was edited by hand (that edit is lost)

Edit site/lyrics-and-chords/page.md, then run this. The web page is made from the same file by publish_site.py.
README.md starts with a comment holding a checksum of what this script wrote. If README.md no longer matches
it (someone edited it by hand), this script stops rather than overwrite the edit. Standard library only.
"""

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "site"))
import render_page  # noqa: E402

SOURCE = ROOT / "site" / "lyrics-and-chords" / "page.md"
README = ROOT / "README.md"
HEADER = "<!-- Generated from site/lyrics-and-chords/page.md by build_readme.py. Edit that file, not this one. (checksum: {sum}) -->\n\n"
HEADER_RE = re.compile(r"\A<!-- Generated from \S+ by build_readme\.py\. Edit that file, not this one\. \(checksum: ([0-9a-f]{12})\) -->\n\n")


def checksum(body):
    return hashlib.sha256(body.encode("utf-8")).hexdigest()[:12]


def make_readme():
    """The README text this source gives."""
    body = render_page.render(SOURCE.read_text(encoding="utf-8"), "readme")
    if "{{" in body:
        raise ValueError("the README text still has a {{placeholder}}: put it in a <!--[page]--> block")
    return HEADER.format(sum=checksum(body)) + body


def stop(message):
    print(f"Stopped: {message}")
    sys.exit(1)


def main():
    args = sys.argv[1:]
    if any(a not in ("--check", "--force") for a in args):
        stop("usage: python3 build_readme.py [--check | --force]")
    try:
        wanted = make_readme()
    except ValueError as problem:
        stop(str(problem))
    current = README.read_text(encoding="utf-8") if README.exists() else None

    if "--check" in args:
        if current == wanted:
            print("README.md is up to date.")
            return
        stop("README.md is not up to date. Edit site/lyrics-and-chords/page.md and run: python3 build_readme.py")

    if current == wanted:
        print("README.md is already up to date.")
        return
    if current is not None and "--force" not in args:
        header = HEADER_RE.match(current)
        if not header:
            stop("README.md has no generated header, so it looks hand-written. Compare it with the new text "
                 "(git diff after running with --force), copy what you want to keep into "
                 "site/lyrics-and-chords/page.md, then run with --force.")
        if checksum(current[header.end():]) != header.group(1):
            stop("README.md was edited by hand since it was generated. Copy those edits into "
                 "site/lyrics-and-chords/page.md, then run with --force.")
    README.write_text(wanted, encoding="utf-8")
    print(f"Wrote README.md from {SOURCE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
