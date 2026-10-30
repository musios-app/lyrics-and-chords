#!/usr/bin/env python3
"""Build the Lyrics & Chords skill: dist/lyrics-and-chords/ and dist/lyrics-and-chords.skill.

Usage: python3 build.py [--plugins PATH]

What it does, in order:
  1. Checks SKILL.md against the Agent Skills rules (name, description, size, version).
  2. Bundles ChordSheetJS into one file, scripts/lib/chordsheetjs.mjs, so the skill needs no npm install.
  3. Copies the scripts, changing only the import of the library to point at that file.
  4. Copies SKILL.md and LICENSE, and writes NOTICE.txt (what is bundled, and where its source is).
  5. Zips the folder into a .skill file.
  6. Writes the ChatGPT plugin into your clone of musios-app/musios-ai-plugins (plugins/lyrics-and-chords/ there), the
     repository the ChatGPT app adds with "Add plugin marketplace". Never touches git there. Its marketplace file lists
     the plugins and is edited by hand in that repository.
  7. Runs the packaged scripts from a folder outside this repo, to prove the package stands alone.

Needs: Python 3, Node.js 18 or later, and `npm install` run once in this folder (for the bundler).
On a Mac, dist/ is marked so that Dropbox does not sync it.
Python standard library only. Never edit dist/ by hand.
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
DIST = ROOT / "dist"
DEFAULT_PLUGINS = Path.home() / "Dropbox/code/musios-app/musios-ai-plugins"
LIBRARY_NAMES = [
    "ChordProParser", "ChordsOverWordsParser", "UltimateGuitarParser", "ChordSheetSerializer",
    "TextFormatter", "ChordProFormatter", "ChordsOverWordsFormatter",
]
SKILL_DIRECTORY_FILES = ["SKILL.md", "LICENSE", "NOTICE.txt", "scripts"]


def stop(message):
    print(f"Build stopped: {message}", file=sys.stderr)
    sys.exit(1)


def read_frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        stop("SKILL.md must start with a --- frontmatter block.")
    fields, current = {}, None
    for line in match.group(1).split("\n"):
        if re.match(r"^\S", line) and ":" in line:
            key, _, value = line.partition(":")
            current = key.strip()
            fields[current] = value.strip().strip('"')
        elif current and line.strip():
            sub_key, _, sub_value = line.strip().partition(":")
            fields[f"{current}.{sub_key.strip()}"] = sub_value.strip().strip('"')
    return fields


def check_skill(version):
    text = (ROOT / "SKILL.md").read_text(encoding="utf8")
    fields = read_frontmatter(text)
    name = fields.get("name", "")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name) or len(name) > 64:
        stop(f'the skill name "{name}" must be 1-64 lowercase letters, digits and single hyphens.')
    if name != "lyrics-and-chords":
        stop(f'the skill name is "{name}" but the packaged folder is lyrics-and-chords; they must match.')
    description = fields.get("description", "")
    if not 1 <= len(description) <= 1024:
        stop(f"the description is {len(description)} characters; it must be 1-1024.")
    if len(fields.get("compatibility", "")) > 500:
        stop("the compatibility text is longer than 500 characters.")
    if fields.get("metadata.version") != version:
        stop(f'SKILL.md says version {fields.get("metadata.version")} but package.json says {version}; make them agree.')
    lines = text.count("\n") + 1
    if lines > 500:
        stop(f"SKILL.md is {lines} lines; the standard asks for under 500. Move detail into references/.")
    referenced = re.findall(r"`((?:docs|tests)/[^`]*)`", text)
    if referenced:
        stop(f"SKILL.md points at files that are not in the package: {', '.join(referenced)}")
    return text


def run(command, **options):
    result = subprocess.run(command, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=120, **options)
    if result.returncode != 0:
        stop(f"{' '.join(str(c) for c in command)}\n{result.stderr or result.stdout}")
    return result


def bundle_library(target):
    esbuild = ROOT / "node_modules" / ".bin" / "esbuild"
    if not esbuild.exists():
        stop("the bundler is missing. Run `npm install` in this folder first.")
    entry = DIST / "_library_entry.js"
    entry.write_text(f'export {{ {", ".join(LIBRARY_NAMES)} }} from "chordsheetjs";\n', encoding="utf8")
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        run([str(esbuild), str(entry), "--bundle", "--platform=node", "--format=esm", "--minify",
             f"--outfile={target}", "--log-level=error"], cwd=ROOT)
    finally:
        entry.unlink(missing_ok=True)


def copy_scripts(target):
    target.mkdir(parents=True, exist_ok=True)
    rewritten = []
    for source in sorted((ROOT / "scripts").glob("*.mjs")):
        text = source.read_text(encoding="utf8")
        fixed = re.sub(r'from "chordsheetjs"', 'from "./lib/chordsheetjs.mjs"', text)
        if fixed != text:
            rewritten.append(source.name)
        if re.search(r'from "chordsheetjs"|import\("chordsheetjs"\)', fixed):
            stop(f"{source.name} still imports chordsheetjs directly.")
        (target / source.name).write_text(fixed, encoding="utf8")
    return rewritten


def write_notice(version, chordsheetjs_version):
    return (
        "Lyrics & Chords skill\n"
        f"Version {version}\n"
        "Licence: GPL-2.0-only (see LICENSE).\n\n"
        "This skill bundles:\n\n"
        f"  ChordSheetJS {chordsheetjs_version}, by Martijn Versluis\n"
        "  Licence: GPL-2.0-only\n"
        "  Source: https://github.com/martijnversluis/ChordSheetJS\n"
        "  It is included in scripts/lib/chordsheetjs.mjs, compressed by esbuild from that source,\n"
        "  with nothing else added. It has no other dependencies.\n\n"
        "The rest of the skill (SKILL.md and the other files in scripts/) is the source of this\n"
        "package, in readable form. The development repository holds the tests and design notes.\n"
    )


def make_zip(folder, archive):
    archive.unlink(missing_ok=True)
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(folder.rglob("*")):
            if path.is_file():
                z.write(path, Path(folder.name) / path.relative_to(folder))


def smoke_test(archive):
    """Unpack the .skill outside this repo and run the packaged scripts."""
    with tempfile.TemporaryDirectory(prefix="lyrics-and-chords-test-") as temp:
        with zipfile.ZipFile(archive) as z:
            z.extractall(temp)
        skill = Path(temp) / "lyrics-and-chords"
        if (skill / "node_modules").exists():
            stop("the package contains node_modules.")
        sample = ROOT / "tests" / "samples" / "genius" / "because.embedded.txt"
        song = Path(temp) / "song.txt"
        shutil.copy(sample, song)
        facts = Path(temp) / "facts.json"
        facts.write_text(json.dumps({"title": "Because", "artist": "Guy d'Hardelot", "date": "1902"}), encoding="utf8")

        loaded = run(["node", "scripts/load.mjs", str(song), "--facts", str(facts), "--as", "chordpro"], cwd=skill)
        result = json.loads(loaded.stdout)
        if result["status"] != "ok" or "{title: Because}" not in result.get("output", ""):
            stop(f"packaged load did not give the expected result: {loaded.stdout[:300]}")

        pasted = subprocess.run(["node", "scripts/load.mjs", "-"], cwd=skill, input="[Verse]\nOne line here\n",
                                capture_output=True, text=True, timeout=60)
        if json.loads(pasted.stdout)["status"] != "needs-info":
            stop("packaged load of pasted text did not report the missing facts.")

        broken = subprocess.run(["node", "scripts/load.mjs", "-"], cwd=skill, input="{title: Broken\nLine [C]two\n",
                                capture_output=True, text=True, timeout=60)
        if broken.returncode != 1 or json.loads(broken.stdout)["status"] != "failed":
            stop("packaged load did not fail cleanly on a broken file.")

        for script in ("parse", "add-metadata", "set-aside", "check", "format", "load"):
            help_run = subprocess.run(["node", f"scripts/{script}.mjs", "--help"], cwd=skill, capture_output=True, text=True,
                                      stdin=subprocess.DEVNULL, timeout=30)
            if help_run.returncode != 0:
                stop(f"scripts/{script}.mjs --help failed in the package.")
    return True


def write_chatgpt_plugin(folder, version, plugins_repo):
    """The ChatGPT app adds a marketplace from a GitHub repository: musios-ai-plugins. This writes the plugin into a clone of it."""
    plugin = plugins_repo / "plugins" / "lyrics-and-chords"
    # Update the files where they are, rather than deleting the folder and copying it again: Dropbox makes
    # "conflicted copies" of files that are deleted and recreated while it syncs.
    target = plugin / "skills" / "lyrics-and-chords"
    wanted = {path.relative_to(folder) for path in folder.rglob("*") if path.is_file()}
    if target.exists():
        for path in sorted(target.rglob("*"), reverse=True):
            if path.is_file() and path.relative_to(target) not in wanted:
                path.unlink()
            elif path.is_dir() and not any(path.iterdir()):
                path.rmdir()
    for relative in sorted(wanted):
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists() or destination.read_bytes() != (folder / relative).read_bytes():
            shutil.copyfile(folder / relative, destination)
    manifest = {
        "name": "lyrics-and-chords",
        "version": version,
        "description": "Loads song lyric and chord files and checks that no word or chord was lost.",
        "author": {"name": "Andrew Hunt (musios)", "url": "https://musios.app/"},
        "homepage": "https://musios.app/projects/lyrics-and-chords/",
        "license": "GPL-2.0-only",
        "keywords": ["lyrics", "chords", "songwriting"],
        "skills": "./skills/",
        "interface": {
            "displayName": "Lyrics & Chords",
            "shortDescription": "Load song lyrics and chord sheets",
            "category": "Productivity",
            "developerName": "musios",
            "websiteURL": "https://musios.app/projects/lyrics-and-chords/",
            "defaultPrompt": ["Use the lyrics-and-chords skill to load my lyrics"],
        },
    }
    (plugin / ".codex-plugin").mkdir(parents=True, exist_ok=True)
    (plugin / ".codex-plugin" / "plugin.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")


def keep_dist_out_of_dropbox():
    """On a Mac, ask Dropbox (the File Provider kind) not to sync dist/, which is generated.
    Harmless where Dropbox is not used. Only this repository's dist/ is touched."""
    if sys.platform == "darwin":
        subprocess.run(["xattr", "-w", "com.apple.fileprovider.ignore#P", "1", str(DIST)], capture_output=True)


def main():
    parser = argparse.ArgumentParser(description="Build the Lyrics & Chords skill.")
    parser.add_argument("--plugins", type=Path, default=DEFAULT_PLUGINS, help="your clone of musios-app/musios-ai-plugins")
    args = parser.parse_args()
    if not (args.plugins / ".agents" / "plugins" / "marketplace.json").is_file():
        stop(f"{args.plugins} doesn't look like musios-ai-plugins (no .agents/plugins/marketplace.json). Use --plugins to point at it.")
    package = json.loads((ROOT / "package.json").read_text(encoding="utf8"))
    version = package["version"]
    check_skill(version)

    folder = DIST / "lyrics-and-chords"
    # Empty dist/ but keep the folder itself: a Dropbox "ignore" setting lives on the folder, and
    # deleting and recreating it on every build also makes Dropbox keep "conflicted copies".
    DIST.mkdir(exist_ok=True)
    for child in DIST.iterdir():
        shutil.rmtree(child) if child.is_dir() else child.unlink()
    keep_dist_out_of_dropbox()

    bundle_library(folder / "scripts" / "lib" / "chordsheetjs.mjs")
    rewritten = copy_scripts(folder / "scripts")
    if sorted(rewritten) != ["format.mjs", "parse.mjs"]:
        stop(f"expected parse.mjs and format.mjs to import the library, found: {rewritten}")

    shutil.copy(ROOT / "SKILL.md", folder / "SKILL.md")
    shutil.copy(ROOT / "LICENSE", folder / "LICENSE")
    library_version = json.loads((ROOT / "node_modules" / "chordsheetjs" / "package.json").read_text(encoding="utf8"))["version"]
    (folder / "NOTICE.txt").write_text(write_notice(version, library_version), encoding="utf8")

    archive = DIST / "lyrics-and-chords.skill"
    make_zip(folder, archive)
    smoke_test(archive)
    write_chatgpt_plugin(folder, version, args.plugins)

    print(f"Built lyrics-and-chords {version} (ChordSheetJS {library_version})")
    for path in sorted(folder.rglob("*")):
        if path.is_file():
            print(f"  {str(path.relative_to(folder)):34} {path.stat().st_size:>9,} bytes")
    print(f"  {archive.relative_to(ROOT)}  {archive.stat().st_size:,} bytes")
    print(f"ChatGPT plugin written to {args.plugins}/plugins/lyrics-and-chords/ (nothing committed there)")
    print("Packaged scripts passed a test run outside this folder.")


if __name__ == "__main__":
    main()
