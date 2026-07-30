# AGENTS instructions

A digital edition of Grigor Narekatsi's _Book of Lamentations_
(Մատեան ողբերգութեան): the Grabar original, a modern Armenian translation, and a
line-to-line mapping between them. React 19 + Vite, react-router, HeroUI,
Tailwind 4, oxlint/oxfmt.

**The mapping is the point of this project.** It is what no other digital
edition has. Treat it as the most valuable thing in the repo.

## Armenian punctuation

Armenian punctuation does not map onto ASCII, and the marks are visually
_swapped_ relative to Latin. Getting this wrong silently corrupts the text.

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

A `:` touching a letter is the worst of these — remark reads `:բան` as a text
directive and drops the word. The build rejects inline directives.

`.` and `։` are different marks with different jobs, not variants. ստորակետ and
միջակետ have no Armenian codepoint; ASCII `,` and `.` are correct.

The build checks every extracted string against this allowlist, naming the file,
section, line and column. Anything else, digits included, fails until added.

```
letters    U+0531–U+0556, U+0561–U+0587 (through the ligature և)
armenian   ՚ ՛ ՜ ՝ ՞ (U+055A–U+055E), ։ (U+0589), ֊ (U+058A)
shared     space , .  « »  …  –  ( )
hyphen     -  joins word material only (Ամէն-իւն, «Ամեն»-ի); never a dash
```

## Repository layout

```
book/<edition>/*.md          source of truth, hand-authored
src/assets/mapping_*.json    hand-authored line-to-line mapping
src/assets/generated/        GENERATED — never edit
scripts/build-books.js       the generator + CLI
scripts/vite-plugin-books.js Vite plugin wrapping it
```

Output mirrors the source tree: `book/original/` → `src/assets/generated/original/`,
with chapters merged into `chapters.json` and each standalone page keeping its
own name. Adding an edition is one string in `sources`.

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
- **Blank lines separate sections.** Line breaks inside a paragraph are not
  meaningful, so text may be rewrapped freely. This is deliberate.
- Standalone pages (`prologue.md`, `epilogue.md`) have no `:::section` blocks —
  a `heading`, then blank-line-separated paragraphs.
- Parsing goes through remark (`remark-parse`, `remark-frontmatter`,
  `remark-directive`) and reads the **mdast object graph**. Do not hand-parse
  Markdown text.

## The mapping

`src/assets/mapping_<edition>.json` pairs `original` line ranges with
`translation` ranges. Validated on every build:

- Ranges are **zero-based and inclusive**: `[0, 5]` is six lines.
- Every line of **both** texts must be covered **exactly once** — no gaps, no
  overlaps.
- `mode: "line"` pairs ranges position by position, so both must be the **same
  length**. `mode: "group"` presents them as blocks and may differ.
- Editing a text shifts indices, so a corpus change usually means a mapping
  change. The build names the section that broke.

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

- **The React Compiler is enabled** (`vite.config.js`). Do **not** add
  `useCallback`/`useMemo` — they are noise and can defeat its analysis.
- **No `useEffect` for derived values.** Compute during render, as `Layout.jsx`
  does from `location.pathname`.
- Chapter and section numbers render as Armenian numerals via `toArmenian()`.
- Comments explain _why_. Keep them focused and concise. Do not add ones that restate the code.
- Do not use single-line `if` or `for` statements — put curly braces instead.
- Stay task-focused, keep the code clean, and prioritize performance.
- Do use conventional commits

## Known open items

- Over 90 chapters yet to come; the whole corpus is imported statically, so bundle
  size will need code splitting or prerendering.
- Static prerendering is the planned solution for metadata, social previews, and
  crawlability.
- `sitemap.xml` / `robots.txt` are emitted into the bundle only when `SITE_URL`
  is set. No host, no files — never a placeholder.
- Planning font scaling for the book content
