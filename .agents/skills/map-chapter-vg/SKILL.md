---
name: map-chapter-vg
description: >
  Map one chapter of Վ. Գևորգյան's (vg) modern-Armenian translation of the Book of Lamentations onto the existing original chapter — generate the vg markdown from the translation.txt beside this skill plus the per-chapter mapping JSON against book/original/chapter_<n>.md, then run a proofreading pass. Use when the user asks to map, add, or generate a vg chapter, e.g. "/map-chapter-vg map chapter 40".
---

# Map a vg chapter

Turn the translation beside this skill into a mapped vg chapter, paired with the original chapter already in the corpus. Read the root `AGENTS.md` first — the Armenian-punctuation table, corpus format, and mapping-validation rules there are binding and are summarized below.

The **chapter number** comes from the prompt (e.g. "map chapter 40"). If it is missing, ask. `translation.txt` holds exactly one chapter at a time; the number is not in the file.

If `book/translation_vg/chapter_<n>.md` or `book/mapping_vg/chapter_<n>.json` already exists, stop and ask before overwriting.

## Inputs (read-only — never edit)

- `book/original/chapter_<n>.md` — the Grabar chapter, already authored and proofread. It is the source of truth for the original's sections and lines.
- `translation.txt` (in this skill's folder) — vg's modern Armenian, the same chapter.
- `book/translation_vg/chapter_1.md` and `book/mapping_vg/chapter_1.json` — the reference example, and the source of the heading (see below).

In `translation.txt`, **a line is the atomic unit** and **a single blank line separates sections**. Do not disassemble, merge, or rewrite lines. The `.txt` is the source of truth for the translation; treat it as immutable.

The same protection covers the **text** of the `.md` you emit — the Armenian lines and heading must not be reworded, retyped, re-punctuated, or re-broken after the fact without explicit approval. If the build rejects a character (a Latin lookalike, a stray digit), report it and ask; never swap it silently. This is **not** a ban on mechanical formatting: running `oxfmt` (whitespace and layout only, never content) to satisfy the build is expected and needs no approval.

### Counting the original's lines

Mapping indices must match the lines the build extracts, which are not always the markdown's paragraphs: in a `:::section{number=<n> prose}` section (chapters 34, 75, 92 and 93), each soft-broken line is a line. Run `npm run books` and read the chapter from `src/assets/generated/original/chapters.json` — `sections[i]` is section _i + 1_'s lines, exactly as the validator counts them. Read it; never edit it.

## Outputs

1. `book/translation_vg/chapter_<n>.md` — vg markdown.
2. `book/mapping_vg/chapter_<n>.json` — the line/block mapping.

vg is a partial edition: it lacks some chapters, the superscription and the colophon among them. That is expected — map only what `translation.txt` provides, and never create files for chapters or pages vg lacks. `vg` is listed in `partialEditions` in `scripts/build-books.js`, which is what lets it lack chapters; never add another edition to it.

### Reference

Study `chapter_1` as the reference example before writing — `book/translation_vg/chapter_1.md` and `book/mapping_vg/chapter_1.json` — and take the heading from it. If the skeletons below ever differ from it, follow the real files. `book/mapping_mk/chapter_<n>.json` shows how the same original lines were grouped against another modern translation — use it as a guide to the original's sense units, never as a template: vg's lineation differs.

### Markdown shape

`translation.txt` carries **no heading** — **copy it verbatim from `book/translation_vg/chapter_1.md`**. The translation frontmatter `heading` is a **single string**.

```markdown
---
number: <n>
heading: Heading
---

:::section{number=1}

Line 1

Line 2

:::
```

- `number` must equal `<n>` and the file name.
- Sections are numbered from 1 with no gaps, in source order.
- **One source line → one paragraph**, blank-line separated, in order. Lines are copied verbatim from the `.txt`; do not rewrap or edit the text.
- The translation never takes the `prose` flag.

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
- Map `heading` with the same zero-based pair format as a section. Usually pair the original's two lines with the translation's one using a single `block`: `[0, 1] → [0, 0]`.
- `translation.txt` must have the **same number of sections** as the original chapter, and section _i_ of the original pairs with section _i_ of the translation. If the counts differ, stop and flag it — report both counts and where the sections seem to drift apart. Do not force a mapping and do not move section breaks. Once the user confirms which sections vg lacks, write each as an empty `:::section{number=<n> untranslated}` block followed by `:::`, and map it as `null` in `sections`.
- `sections` is one array **per section, in order**; each holds the pairings for that section, and indices are **local to the section** (each section restarts at line 0 for both texts).
- Ranges are **zero-based and inclusive**: `[0, 5]` is six lines.
- Every line of **both** texts must be covered **exactly once** — no gaps, no overlaps.
- Pairs stay in source order on **both** sides. When the translation reorders lines, cover the reordered stretch with one `block` large enough that neither side runs backwards.
- `mode: "line"` pairs the two ranges position-by-position, so they must be the **same length**. Use it whenever the lines correspond one-to-one.
- `mode: "block"` presents the two ranges as blocks and they may differ in length. Use it when the correspondence is many-to-one, one-to-many, or reordered — anything that is not a clean line-for-line match.
- Keep each `block` pair as tight as the sense allows — split at real meaning boundaries rather than lumping distinct passages into one — but never at the cost of a clean, faithful mapping.
- Merge adjacent `line` pairs when both ranges are contiguous.

## Proofreading pass — report, do not fix

While mapping, **collect** (never silently change):

- Typos in the translation.
- Mismatches between original and translation (a line in one with no counterpart in the other, obviously divergent sense, etc.).
- Anything wrong you happen to notice in the original — it is already proofread, so do not audit it.
- When needed, verify findings against reliable online sources and cite them.

**Report every finding at the end as a numbered list**, located by the `.md` file and its actual line number there (not the paragraph index), with the section number for context. If uncertainty remains, **ask** — never assume or alter text under the hood.

### Armenian punctuation-confusion check

The character allowlist catches Latin lookalikes, but it cannot catch one valid Armenian mark substituted for another. After creating the markdown, search it for `՛`, `՜` and `՞`, and review every hit in context, noting each one's line number.

- Determine the mark from the word's grammatical role, not its appearance. In particular, check interrogatives, vocatives, imperatives, prohibitive `մի`, and constructions such as `չէ՞ որ`.
- Compare parallel or repeated lines. A lone `՜` in a run of `ինչպե՞ս` questions, an imperative with `՜` among imperatives with `՛`, or vocative `ո՛վ` among vocatives with `ո՜վ` is a strong typo candidate.
- Check the aligned original line and `book/translation_mk/chapter_<n>.md`. Use them as evidence, not as an automatic replacement: a form such as exclamatory `ինչպե՜ս` can be legitimate outside an actual question.
- Do not normalize marks mechanically. Report a candidate only after the sentence meaning and immediate context support it.

## Verify

After writing the two files, regenerate and validate:

```sh
npm run books:check
```

It confirms the generated output is current and that the mapping is valid (coverage, ranges, `line`-mode length equality). Fix any error it names — usually a range that leaves a gap, overlaps, or mismatches a `line`-mode length. If it reports stale output, run `npm run books` and check again.

Then run `npm run fmt` to format the new files (this is the expected, approved formatting pass — it never touches the text), and the remaining checks the root `AGENTS.md` lists (`lint`, `test`, `build`). All must pass.

Be careful, accurate, and precise.
