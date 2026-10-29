// The README and the web page come from one source, site/lyrics-and-chords/page.md.
// These tests make sure README.md was generated from it (not edited by hand), that page-only text never reaches the
// README, and that the page keeps its placeholders for publish_site.py. They need python3, as build.py does.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = readFileSync(join(ROOT, "site", "lyrics-and-chords", "page.md"), "utf8");
const README = readFileSync(join(ROOT, "README.md"), "utf8");

// Render the source for one target with the project's own renderer.
const render = (text, target) => {
  const r = spawnSync(
    "python3",
    ["-c", "import sys; sys.path.insert(0, 'site'); import render_page; sys.stdout.write(render_page.render(sys.stdin.read(), sys.argv[1]))", target],
    { cwd: ROOT, input: text, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};

test("README.md is generated from page.md: it fails after a hand edit, or after page.md changed without a rebuild", () => {
  const r = spawnSync("python3", ["build_readme.py", "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}\nEdit site/lyrics-and-chords/page.md, then run: python3 build_readme.py`);
});

test("page-only text never appears in the README", () => {
  const readme = render(SOURCE, "readme");
  for (const pageOnly of ["{{", "{% raw %}", "{% endraw %}", "<style>", "gs-start", "gs-steps", "text-bg-warning", "Download lyrics-and-chords.skill", "layout: default", "{#"]) {
    assert.ok(!readme.includes(pageOnly), `the README has page-only text: ${pageOnly}`);
  }
  assert.ok(!readme.startsWith("---"), "front matter belongs to the page only");
  assert.ok(readme.startsWith("# "), "the README opens with its title");
  assert.ok(!/<!--\[/.test(readme), "no marker is left in the README text");
  assert.ok(README.includes("Generated from site/lyrics-and-chords/page.md"), "README.md carries its generated header");
});

test("the page keeps its version and commit placeholders, and starts with its front matter", () => {
  const page = render(SOURCE, "page");
  assert.ok(page.startsWith("---\n"), "the page must start with its front matter");
  assert.ok(page.includes("{{version}}"), "publish_site.py fills in the version");
  assert.ok(page.includes("{{commit}}"), "publish_site.py fills in the commit");
  assert.ok(!/<!--\[/.test(page), "no marker is left in the page text");
  assert.ok(page.includes("software:"), "the SoftwareApplication front matter is kept");
});

test("README-only text never appears in the page, and the two share their common headings", () => {
  const page = render(SOURCE, "page");
  assert.ok(!page.includes("Build and install"), "developer sections are README-only");
  assert.ok(!page.includes("build_readme.py"), "the README build is not mentioned on the page");
  const headings = (t) => t.split("\n").filter((l) => /^## /.test(l) && !l.includes("Lyrics & Chords Skill")).map((l) => l.replace(/ \{#[^}]*\}$/, ""));
  const shared = headings(render(SOURCE, "readme")).filter((h) => headings(page).includes(h));
  for (const wanted of ["## Formats", "## Other features", "## Return JSON Object", "## Licence and source"]) {
    assert.ok(shared.includes(wanted), `${wanted} is in both`);
  }
});

test("the renderer: blocks keep only the wanted lines, inline markers keep the line together, bad markers are refused", () => {
  const text = "a\n<!--[page]-->\nonly page\n<!--[/page]-->\n<!--[readme]-->\nonly readme\n<!--[/readme]-->\nb\n";
  assert.equal(render(text, "page"), "a\nonly page\nb\n");
  assert.equal(render(text, "readme"), "a\nonly readme\nb\n");
  const inline = "Download<!--[page]--> (v1)<!--[/page]--> now\n";
  assert.equal(render(inline, "page"), "Download (v1) now\n");
  assert.equal(render(inline, "readme"), "Download now\n");
  const bad = spawnSync("python3", ["-c", "import sys; sys.path.insert(0, 'site'); import render_page; render_page.render('<!--[page]-->\\nnever closed\\n', 'page')"], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(bad.status, 0, "an unmatched marker is refused");
});
