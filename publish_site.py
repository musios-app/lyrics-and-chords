#!/usr/bin/env python3
"""Copy the download page, the built .skill and the source into the musios.app site.

Usage:
    python3 publish_site.py                       # uses the default site folder
    python3 publish_site.py --site PATH           # a different clone of musios-app.github.io
    python3 publish_site.py --allow-uncommitted   # a trial run: the source zip is still made from the last commit

Run `python3 build.py` first, and commit your changes. This copies the page, the .skill and a source
zip into the site clone's projects/lyrics-and-chords/ folder and nothing else: it doesn't touch git
there. Review and push the site yourself. Python standard library only.

The source zip is there because the licence (GPL-2.0-only) asks that anyone who receives the .skill
can get the source. It is made with `git archive`, so it holds exactly the committed files.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGE = ROOT / "site" / "lyrics-and-chords" / "index.md"
SKILL_FILE = ROOT / "dist" / "lyrics-and-chords.skill"
NAME = "lyrics-and-chords"
DEFAULT_SITE = Path.home() / "Dropbox/code/musios-app/musios-app.github.io"


def stop(message):
    print(f"Stopped: {message}")
    sys.exit(1)


def git(*args):
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        stop(f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout


def check_skill_is_current(version):
    """The .skill must be a build of the source as it is now."""
    if not SKILL_FILE.exists():
        stop(f"{SKILL_FILE.relative_to(ROOT)} not found. Run: python3 build.py")
    with zipfile.ZipFile(SKILL_FILE) as z:
        packaged = z.read(f"{NAME}/SKILL.md")
    built = re.search(rb'^\s*version:\s*"([^"]+)"', packaged, re.MULTILINE)
    built = built.group(1).decode() if built else None
    if built != version:
        stop(f"the built .skill is version {built}, but package.json says {version}. Run: python3 build.py")
    if packaged != (ROOT / "SKILL.md").read_bytes():
        stop("the built .skill is out of date: its SKILL.md differs from SKILL.md. Run: python3 build.py")
    newest_source = max(p.stat().st_mtime for p in (ROOT / "scripts").glob("*.mjs"))
    if SKILL_FILE.stat().st_mtime < newest_source:
        stop("a script is newer than the built .skill. Run: python3 build.py")


def make_source_zip(version, target):
    """The committed files, as a zip with one top folder."""
    git("archive", "--format=zip", f"--prefix={NAME}-{version}/", "-o", str(target), "HEAD")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--site", type=Path, default=DEFAULT_SITE, help="your clone of musios-app.github.io")
    parser.add_argument("--allow-uncommitted", action="store_true",
                        help="go ahead although tracked files have uncommitted changes (trial runs)")
    args = parser.parse_args()

    version = json.loads((ROOT / "package.json").read_text(encoding="utf8"))["version"]
    check_skill_is_current(version)

    uncommitted = git("status", "--porcelain", "--untracked-files=no").strip()
    if uncommitted and not args.allow_uncommitted:
        stop("there are uncommitted changes, so the source zip would not match the .skill:\n"
             + uncommitted + "\nCommit them first (or use --allow-uncommitted for a trial run).")
    commit = git("rev-parse", "--short", "HEAD").strip()

    if not (args.site / "_config.yml").exists():
        stop(f"{args.site} doesn't look like the musios.app site (no _config.yml). Use --site to point at it.")

    page = PAGE.read_text(encoding="utf8").replace("{{version}}", version).replace("{{commit}}", commit)
    if "{{" in page.replace("{% raw %}", "").replace("{% endraw %}", ""):
        stop("the page still has an unfilled {{placeholder}}")

    folder = args.site / "projects" / NAME
    downloads = folder / "downloads"
    downloads.mkdir(parents=True, exist_ok=True)

    (folder / "index.md").write_text(page, encoding="utf8")
    shutil.copyfile(SKILL_FILE, downloads / f"{NAME}.skill")
    shutil.copyfile(SKILL_FILE, downloads / f"{NAME}-{version}.skill")
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / "source.zip"
        make_source_zip(version, source)
        shutil.copyfile(source, downloads / f"{NAME}-{version}-source.zip")

    print(f"Copied version {version} (commit {commit}) into {folder}:")
    print("  index.md")
    print(f"  downloads/{NAME}.skill")
    print(f"  downloads/{NAME}-{version}.skill")
    print(f"  downloads/{NAME}-{version}-source.zip")
    if uncommitted:
        print("Warning: tracked files have uncommitted changes; the source zip holds the last commit only.")
    print("Nothing was committed or pushed in the site folder.")


if __name__ == "__main__":
    main()
