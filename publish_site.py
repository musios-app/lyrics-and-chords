#!/usr/bin/env python3
"""Copy the download page, the built .skill and the source into the musios.app site.

Usage:
    python3 publish_site.py                       # uses the default site folder
    python3 publish_site.py --site PATH           # a different clone of musios-app.github.io
    python3 publish_site.py --allow-uncommitted   # a trial run: the source zip is still made from the last commit

Run `python3 build.py` first, and commit your changes. This copies the page, the example pages (made by
running the packaged skill on the files in examples/), the .skill and a source zip into the site clone's projects/lyrics-and-chords/ folder and nothing else: it doesn't touch git
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
EXAMPLES_FILE = ROOT / "site" / "lyrics-and-chords" / "examples.json"
EXAMPLES_DIR = ROOT / "examples"
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


def compact_json(result):
    """The result as JSON with one song line to a row: readable, and still valid JSON."""
    others = {k: v for k, v in result.items() if k not in ("song", "output")}
    rows = ",\n".join("      " + json.dumps(line, ensure_ascii=False) for line in result["song"]["lines"])
    head = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in others.items())
    return "{\n" + head + ',\n  "song": {\n    "type": "chordSheet",\n    "lines": [\n' + rows + "\n    ]\n  }\n}"


def run_examples(examples, skill_dir):
    """Run the packaged skill on each example file; returns (input text, cleaned text, JSON text) for each."""
    out = []
    with tempfile.TemporaryDirectory() as temp:
        for example in examples:
            path = EXAMPLES_DIR / example["file"]
            if example.get("docx"):
                word = subprocess.run(["node", "scripts/read-docx.mjs", str(path)], cwd=skill_dir, capture_output=True,
                                      text=True, stdin=subprocess.DEVNULL)
                if word.returncode != 0:
                    stop(f"example {example['slug']}: {word.stderr.strip()}")
                shown = json.loads(word.stdout)["text"]
            else:
                shown = path.read_text(encoding="utf8")
            command = ["node", "scripts/load.mjs", "-" if example.get("stdin") else str(path), "--as", "chords-over-words"]
            if example.get("facts"):
                facts = Path(temp) / f"facts-{example['slug']}.json"
                facts.write_text(json.dumps(example["facts"]), encoding="utf8")
                command += ["--facts", str(facts)]
            if example.get("set_aside"):
                command += ["--set-aside", example["set_aside"]]
            run = subprocess.run(command, cwd=skill_dir, capture_output=True, text=True, timeout=120,
                                 input=shown if example.get("stdin") else None,
                                 stdin=None if example.get("stdin") else subprocess.DEVNULL)
            try:
                result = json.loads(run.stdout)
            except ValueError:
                stop(f"example {example['slug']} gave no result: {run.stderr.strip()}")
            if result["status"] == "failed":
                stop(f"example {example['slug']} failed: {result['problems']}")
            out.append((shown.rstrip("\n"), result["output"].rstrip("\n"), compact_json(result), result))
    return out


def example_page(example, shown, cleaned, formatted, previous, following):
    """A Jekyll page for one example. {% raw %} keeps Jekyll from reading braces in the text."""
    n = example["slug"]
    title = f"Example: {example['name']}"
    note = ""
    if example.get("set_aside"):
        if "," in example["set_aside"]:
            note = " It was loaded with the page text set aside and the title and credits given as facts, which is what Claude does for you."
        else:
            note = " It was loaded with the title line set aside and the title given as a fact, which is what Claude does for you."
    links = ["[All examples](../#lyrics--chords-skill)"]
    if previous:
        links.insert(0, f"[Previous: {previous[1]}](example-{previous[0]}.html)")
    if following:
        links.append(f"[Next: {following[1]}](example-{following[0]}.html)")
    source_block = ""
    if example.get("source_url"):
        source_block = (f"The page: <{example['source_url']}>\n\nThe text on that page:\n\n")
    word = f"\n[Download the Word file](example-{n}.docx)\n" if example.get("docx") else ""
    return (
        f'---\nlayout: default\ntitle: "{title}"\nsitemap: false\nnoindex: true\n---\n\n'
        f"# {title}\n\n**Input Format:** {example['input_format']}\n\n{example['intro']}{note}\n{word}\n"
        f"\\[ [Input](#input) \\]&emsp;\\[ [Clean text output](#clean-text-output) \\]&emsp;\\[ [JSON output](#json-output) \\]\n\n"
        f"## Input {{#input}}\n\n{source_block}{{% raw %}}\n```text\n{shown}\n```\n{{% endraw %}}\n\n"
        f"## Output - Cleaned text {{#clean-text-output}}\n\nThe song written back out as readable text: section names, facts at the top, "
        f"and chords above the words where there are any.\n\n{{% raw %}}\n```text\n{cleaned}\n```\n{{% endraw %}}\n\n"
        f"## Output - Formatted (JSON) {{#json-output}}\n\nWhat the skill returns: one JSON object, with one line of the song on each row below.\n\n"
        f"{{% raw %}}\n```json\n{formatted}\n```\n{{% endraw %}}\n\n" + " · ".join(links) + "\n"
    )


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

    # The page's icon, and any other pictures kept beside it in the repo (site/lyrics-and-chords/images/).
    images = PAGE.parent / "images"
    wanted = re.search(r"^icon:\s*images/(\S+)\s*$", page, re.MULTILINE)
    if wanted and not (images / wanted.group(1)).is_file():
        stop(f"the page names the icon images/{wanted.group(1)}, but {images / wanted.group(1)} is not in the repo.")
    if images.is_dir():
        (folder / "images").mkdir(exist_ok=True)
        for picture in sorted(p for p in images.iterdir() if p.is_file()):
            shutil.copyfile(picture, folder / "images" / picture.name)
    shutil.copyfile(SKILL_FILE, downloads / f"{NAME}.skill")
    shutil.copyfile(SKILL_FILE, downloads / f"{NAME}-{version}.skill")
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / "source.zip"
        make_source_zip(version, source)
        shutil.copyfile(source, downloads / f"{NAME}-{version}-source.zip")

    examples = json.loads(EXAMPLES_FILE.read_text(encoding="utf8"))
    example_folder = folder / "examples"
    example_folder.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        with zipfile.ZipFile(SKILL_FILE) as z:
            z.extractall(temp)
        ran = run_examples(examples, Path(temp) / NAME)
    numbers = [(e["slug"], e["name"]) for e in examples]
    for n, (example, (shown, cleaned, formatted, _)) in enumerate(zip(examples, ran)):
        previous = numbers[n - 1] if n else None
        following = numbers[n + 1] if n + 1 < len(numbers) else None
        (example_folder / f"example-{example['slug']}.md").write_text(
            example_page(example, shown, cleaned, formatted, previous, following), encoding="utf8")
        if example.get("docx"):
            shutil.copyfile(EXAMPLES_DIR / example["file"], example_folder / f"example-{example['slug']}.docx")

    print(f"Copied version {version} (commit {commit}) into {folder}:")
    print("  index.md")
    if images.is_dir():
        print("  images/ (" + ", ".join(sorted(p.name for p in images.iterdir() if p.is_file())) + ")")
    print(f"  downloads/{NAME}.skill")
    print(f"  downloads/{NAME}-{version}.skill")
    print(f"  downloads/{NAME}-{version}-source.zip")
    for example in examples:
        print(f"  examples/example-{example['slug']}.md" + (f" and example-{example['slug']}.docx" if example.get("docx") else ""))
    if uncommitted:
        print("Warning: tracked files have uncommitted changes; the source zip holds the last commit only.")
    print("Nothing was committed or pushed in the site folder.")


if __name__ == "__main__":
    main()
