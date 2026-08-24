# AGENTS instructions

A digital edition of Grigor Narekatsi's _Book of Lamentations_ (Մատեան ողբերգութեան): the Grabar original, a modern Armenian translation, and a line-to-line mapping between them. React 19 + Vite, react-router, HeroUI, Tailwind 4, oxlint/oxfmt.

**The mapping is the point of this project.** It is what no other digital edition has. Treat it as the most valuable thing in the repo.

## Armenian punctuation

Armenian punctuation does not map onto ASCII, and the marks are visually _swapped_ relative to Latin. Getting this wrong silently corrupts the text.

| Mark         | Char | Codepoint | Use                                            |
| ------------ | ---- | --------- | ---------------------------------------------- |
| վերջակետ     | `։`  | U+0589    | Ends a sentence — **looks like a colon**       |
| միջակետ      | `.`  | U+002E    | Mid-sentence pause — a single dot, and correct |
| ստորակետ     | `,`  | U+002C    | Comma                                          |
| բութ         | `՝`  | U+055D    | Pause, apposition                              |
| շեշտ         | `՛`  | U+055B    | Emphasis, on the stressed vowel                |
| բացականչական | `՜`  | U+055C    | Exclamation, on the stressed vowel             |
| հարցական     | `՞`  | U+055E    | Question, on the stressed vowel                |

Never the Latin lookalike: `:`→`։`, `` ` ``→`՝`, `~`→`՜`, `'`→`՛`.

A `:` touching a letter is the worst of these — remark reads `:բան` as a text directive and drops the word. The build rejects inline directives.

`.` and `։` are different marks with different jobs, not variants. ստորակետ and միջակետ have no Armenian codepoint; ASCII `,` and `.` are correct.

The build checks every extracted string against this allowlist, naming the file, section, line and column. Anything else, digits included, fails until added.

```
letters    U+0531–U+0556, U+0561–U+0587 (through the ligature և)
armenian   ՚ ՛ ՜ ՝ ՞ (U+055A–U+055E), ։ (U+0589), ֊ (U+058A)
shared     space , .  « »  …  —  ( )  [ ]
hyphen     -  joins word material only (Ամէն-իւն, «Ամեն»-ի); never a dash
```

Square brackets are plain text (`բան [բառ] բան`).

## Repository layout

```
book/<edition>/*.md              source of truth, hand-authored
book/mapping_<edition>/*.json    hand-authored mapping, one file per chapter
src/assets/generated/            GENERATED — never edit
scripts/build-books.js           the generator + CLI
scripts/vite-plugin-books.js     Vite plugin wrapping it
```

Output mirrors the source tree: `book/original/` → `src/assets/generated/original/`, with chapters merged into `chapters.json` and each standalone page keeping its own name. The per-chapter mappings likewise merge into a single `src/assets/generated/mapping_<edition>.json`, ordered to match the original chapters. Adding an edition is one string in `sources`.

## The corpus format

```markdown
---
number: 40
heading:
  - Heading 1
  - Heading 2
---

:::section{number=1}

Line 1

Line 2

:::
```

- `number` must match the file name; sections numbered from 1, no gaps.
- **`:::section` blocks separate sections; blank lines separate the lines** inside one — the text's own paragraphs in a prose section.
- Outside prose sections, soft breaks inside paragraphs are rejected. Hard Markdown breaks (two trailing spaces or a backslash) are rejected everywhere because `mdast-util-to-string` drops their separator.
- Standalone pages (`superscription.md`, `colophon.md`) have no `:::section` blocks — a `heading`, then blank-line-separated paragraphs.
- Parsing goes through remark (`remark-parse`, `remark-frontmatter`, `remark-directive`) and reads the **mdast object graph**. Do not hand-parse Markdown text.

### Prose sections

In chapters 34, 75, 92 and 93 some original sections run as unbroken paragraphs where the translation is already set line by line. Those sections are lineated into sense units by hand and marked `:::section{number=<n> prose}`. A section that already arrives line by line stays unmarked, even in one of these chapters.

- A soft break inside a prose section starts a new line; blank lines stay the text's own paragraphs.
- The lineation is authored, not derived: never insert, move, or remove a break. Each is a mapped line, so a change shifts every mapping index after it.
- The flag takes no value — `{prose=false}` would read as prose, so it is rejected.
- Generated chapters carry `prose` only when a section uses it: one entry per section, either the zero-based indices where its paragraphs start or `null`.

## The mapping

`book/mapping_<edition>/chapter_<n>.json` pairs `original` line ranges with `translation` ranges, one file per chapter (`.chapter` must match the file name). Each file carries a `heading` mapping and a `sections` array; the build merges them and the app imports the merged file. Validated on every build:

- Ranges are **zero-based and inclusive**: `[0, 5]` is six lines.
- Every line of **both** texts must be covered **exactly once** — no gaps, no overlaps.
- `mode: "line"` pairs ranges position by position, so both must be the **same length**. `mode: "block"` presents them as blocks and may differ.
- `heading` maps the chapter's `heading` lines the same way a section does, but as one list of pairs — the front-matter headings, indexed from 0. The two sides need not be the same length (the original title is often two lines, the translation one), so a heading is usually a single `block` pair.
- Editing a text shifts indices, so a corpus change usually means a mapping change. The build names the heading or section that broke.

## Commands

```sh
npm run books         # regenerate
npm run books:check   # verify output is current and the mapping is valid (CI)
npm run dev           # plugin regenerates and watches book/
npm run build
npm run lint          # oxlint
npm run fmt:check     # oxfmt
npm run test          # node --test: the validator's rejection paths
```

All of `books:check`, `lint`, `fmt:check`, `test`, `build` must pass.

## Code conventions

- **The React Compiler is enabled** (`vite.config.js`). Do **not** add `useCallback`/`useMemo` — they are noise and can defeat its analysis.
- **No `useEffect` for derived values.** Compute during render, as `Layout.jsx` does from `location.pathname`.
- Chapter and section numbers render as Armenian numerals via `toArmenian()`.
- Comments explain _why_. Keep them focused and concise. Do not add ones that restate the code.
- Do not use single-line `if` or `for` statements — put curly braces instead.
- Stay task-focused, keep the code clean, and prioritize performance.
- Do use conventional commits.
- Do not hard-wrap Markdown text to a fixed line width unless explicitly asked.

## Known open items

- The whole corpus is imported statically, so bundle size may need code splitting or prerendering.
- Static prerendering is the planned solution for metadata, social previews, and crawlability.
- `sitemap.xml` / `robots.txt` are emitted into the bundle only when `SITE_URL` is set. No host, no files — never a placeholder.
