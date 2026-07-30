# Narek

[![CI](https://github.com/rubo/narek/actions/workflows/ci.yml/badge.svg)](https://github.com/rubo/narek/actions/workflows/ci.yml)
[![Deploy](https://github.com/rubo/narek/actions/workflows/deploy.yml/badge.svg)](https://github.com/rubo/narek/actions/workflows/deploy.yml)

A digital edition of Grigor Narekatsi's _Book of Lamentations_
(Մատեան ողբերգութեան): the Grabar original, a modern Armenian translation, and a
line-to-line mapping between the two.

## Structure

| Path                        |                                                 |
| --------------------------- | ----------------------------------------------- |
| `book/<edition>/*.md`       | the texts — source of truth                     |
| `src/assets/mapping_*.json` | line-to-line mapping, hand-written              |
| `src/assets/generated/`     | built from `book/`, not committed               |
| `scripts/`                  | the generator, and the Vite plugin that runs it |

Chapters are `chapter_<number>.md` with numbered `:::section` blocks; sections
are separated by blank lines. `prologue.md` and `epilogue.md` are plain
paragraphs under a heading.

## Development

```sh
npm install
npm run dev      # regenerates from book/ and watches it
npm run build
```

`npm run books` regenerates by hand; `npm run books:check` validates the mapping
against both texts. A broken mapping fails the build.

Set `SITE_URL` when building for deployment to emit `sitemap.xml` and
`robots.txt`.

## Contributing

See [AGENTS.md](./AGENTS.md) — Armenian punctuation rules, the corpus format, and
the mapping invariants.
