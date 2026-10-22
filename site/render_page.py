"""Turn the one source for the Lyrics & Chords text into the README or the web page.

The source is site/lyrics-and-chords/page.md. Most of it is written once and used by both. Where the two
differ, mark the difference with a block that names who gets it:

    <!--[page]-->
    This text goes on the web page only.
    <!--[/page]-->

    <!--[readme]-->
    This text goes in the README only.
    <!--[/readme]-->

A block with each marker on its own line keeps just the lines between them. A marker can also sit inside a line:

    Download the file<!--[page]--> (v{{version}})<!--[/page]-->

The markers are HTML comments, so the source still reads normally. Everything else, including ordinary
<!-- comments -->, passes through unchanged. Used by build_readme.py and publish_site.py. Standard library only.
"""

import re

TARGETS = ("page", "readme")

# A block: both markers alone on their lines.
BLOCK = re.compile(r"^<!--\[(\w+)\]-->\n(.*?)^<!--\[/\1\]-->\n", re.S | re.M)
# A marker pair inside a line.
INLINE = re.compile(r"<!--\[(\w+)\]-->(.*?)<!--\[/\1\]-->", re.S)


def _choose(target):
    def pick(match):
        tag, inner = match.group(1), match.group(2)
        if tag not in TARGETS:
            raise ValueError(f"unknown block <!--[{tag}]-->: use one of {', '.join(TARGETS)}")
        return inner if tag == target else ""
    return pick


def render(text, target):
    """The source text for one target ('page' or 'readme')."""
    if target not in TARGETS:
        raise ValueError(f"unknown target {target!r}: use one of {', '.join(TARGETS)}")
    pick = _choose(target)
    out = BLOCK.sub(pick, text)
    out = INLINE.sub(pick, out)
    stray = re.search(r"<!--\[/?\w*\]-->", out)
    if stray:
        line = out[:stray.start()].count("\n") + 1
        raise ValueError(f"a marker is not matched: {stray.group(0)} (line {line} of the {target} text)")
    return out
