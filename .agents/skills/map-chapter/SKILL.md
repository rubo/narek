---
name: map-chapter
description: >
  Map one chapter of the Book of Lamentations from the original.txt and
  translation.txt beside this skill into the corpus — generate the per-chapter
  mapping JSON plus the original and modern-Armenian (mk) markdown files, then
  run a proofreading pass. Use when the user asks to map, add, or generate a
  chapter from those .txt sources.
---

# Map a chapter

Turn the two read-only source texts beside this skill into a mapped chapter of
the corpus. Read the root `AGENTS.md` first — the Armenian-punctuation table,
corpus format, and mapping-validation rules there are binding and are summarized
below.

Before starting, confirm the **chapter number** with the user if it is not
given. `original.txt` and `translation.txt` (in this skill's folder) hold
exactly one chapter pair at a time; the number is not in the files.

## Inputs (read-only — never edit)

- `original.txt` — Grabar, one chapter.
- `translation.txt` — modern Armenian, same chapter.

In both files, **a line is the atomic unit** and **a single blank line separates
sections**. Do not disassemble, merge, or rewrite lines. These `.txt` files are
the source of truth; treat them as immutable.

The same protection covers the **text** of any `.md` you emit — the Armenian
lines and headings must not be reworded, retyped, or re-punctuated after the
fact without explicit approval. This is **not** a ban on mechanical formatting:
running `oxfmt` (whitespace and layout only, never content) to satisfy the
build is expected and needs no approval.

## Outputs

Mirror the numbering across all three files; `<n>` is the chapter number.

1. `book/mapping_mk/chapter_<n>.json` — the line/block mapping.
2. `book/original/chapter_<n>.md` — Grabar markdown.
3. `book/translation_mk/chapter_<n>.md` — modern-Armenian markdown.

Study `chapter_40.*` in each of those three directories as the reference
example before writing, and take the headings from it:

- The `.txt` sources carry **no headings** — **copy them from `chapter_40`**.
  The **original** frontmatter `heading` is a **two-item list** (Grabar title +
  gloss); the modern **translation** frontmatter `heading` is a **single
  string**.

### Markdown shape

The skeletons below orient you; **`chapter_40.*` is authoritative** — if they
ever differ, follow the real files, and lean on chapter 40's real `line`/`block`
choices when judging modes.

```markdown
---
number: <n>
heading:
  - Heading 1
  - Heading 2
---

:::section{number=1}

Line 1

Line 2

:::
```

- `number` must equal `<n>` and the file name.
- Sections are numbered from 1 with no gaps, in source order.
- **One source line → one paragraph**, blank-line separated, in order. Lines are
  copied verbatim from the `.txt`; do not rewrap or edit the text.

### Mapping JSON shape

```json
{
  "chapter": <n>,
  "heading": [{ "original": [0, 1], "translation": [0, 0], "mode": "block" }],
  "sections": [
    [
      { "original": [0, 1], "translation": [0, 1], "mode": "line" },
      { "original": [2, 3], "translation": [2, 3], "mode": "block" }
    ]
  ]
}
```

- `chapter` must equal `<n>` and the file name.
- Map `heading` with the same zero-based pair format as a section. Usually pair
  the original's two lines with the translation's one using a single `block`:
  `[0, 1] → [0, 0]`.
- Both sources must have the **same number of sections**, and section _i_ of the
  original pairs with section _i_ of the translation. If the counts differ (a
  blank line missing or extra in one `.txt`), stop and flag it — do not force a
  mapping.
- `sections` is one array **per section, in order**; each holds the pairings for
  that section, and indices are **local to the section** (each section restarts
  at line 0 for both texts).
- Ranges are **zero-based and inclusive**: `[0, 5]` is six lines.
- Every line of **both** texts must be covered **exactly once** — no gaps, no
  overlaps.
- `mode: "line"` pairs the two ranges position-by-position, so they must be the
  **same length**. Use it whenever the lines correspond one-to-one.
- `mode: "block"` presents the two ranges as blocks and they may differ in
  length. Use it when the correspondence is many-to-one, one-to-many, or
  reordered — anything that is not a clean line-for-line match.
- Keep each `block` pair as tight as the sense allows — split at real meaning
  boundaries rather than lumping distinct passages into one — but never at the
  cost of a clean, faithful mapping.
- Merge adjacent `line` pairs when both ranges are contiguous.

## Proofreading pass — report, do not fix

While mapping, watch both texts and **collect** (never silently change):

- Typos.
- Mismatches between original and translation (a line in one with no counterpart
  in the other, obviously divergent sense, etc.).
- Any form of these words **in the original** that is **capitalized while not at the start of its
  line**: `աստուած`, `տէր`, `տեառն`, `արարիչ`, `բարձրեալ`.
- When needed, verify findings against reliable online sources and cite them.

**Report every finding at the end**, located by the `.md` file and its actual
line number there (not the paragraph index), with the section number for context.
If uncertainty remains, **ask** — never assume or alter text under the hood.

## Verify

After writing the three files, regenerate and validate:

```sh
npm run books:check
```

It confirms the generated output is current and that the mapping is valid
(coverage, ranges, `line`-mode length equality). Fix any error it names —
usually a range that leaves a gap, overlaps, or mismatches a `line`-mode length.

Then run `npm run fmt` to format the three new files (this is the expected,
approved formatting pass — it never touches the text), and the remaining
checks the root `AGENTS.md` lists (`lint`, `test`, `build`). All must pass.

Be careful, accurate, and precise.
