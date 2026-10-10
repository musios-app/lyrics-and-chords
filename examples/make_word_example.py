#!/usr/bin/env python3
"""Make examples/6-word-file.docx from examples/3-labels-without-brackets.txt.

A minimal Word file: one paragraph for each line, a plain title paragraph first. Python standard library only.
Run it again if the text file changes.
"""
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
lines = (HERE / "3-labels-without-brackets.txt").read_text(encoding="utf8").rstrip("\n").split("\n")

paragraphs = []
for line in lines:
    if not line:
        paragraphs.append("<w:p/>")
    else:
        paragraphs.append(f'<w:p><w:r><w:t xml:space="preserve">{escape(line)}</w:t></w:r></w:p>')

document = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
    + "".join(paragraphs)
    + "</w:body></w:document>"
)
content_types = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    "</Types>"
)
rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    "</Relationships>"
)
target = HERE / "6-word-file.docx"
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
    for name, data in (("[Content_Types].xml", content_types), ("_rels/.rels", rels), ("word/document.xml", document)):
        info = zipfile.ZipInfo(name, date_time=(2026, 10, 10, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, data)
print(f"wrote {target.name}: {len(paragraphs)} paragraphs")
