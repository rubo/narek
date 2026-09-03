# Narek

[![CI](https://github.com/rubo/narek/actions/workflows/ci.yml/badge.svg)](https://github.com/rubo/narek/actions/workflows/ci.yml)
[![Deploy](https://github.com/rubo/narek/actions/workflows/deploy.yml/badge.svg)](https://github.com/rubo/narek/actions/workflows/deploy.yml)

A digital edition of Grigor Narekatsi's _Book of Lamentations_ (Մատեան ողբերգութեան): the classical Armenian (Grabar) original, a modern Armenian translation, and a line-to-line mapping between the two.

## Structure

| Path                            |                                                 |
| ------------------------------- | ----------------------------------------------- |
| `book/<edition>/*.md`           | the texts — source of truth                     |
| `book/mapping_<edition>/*.json` | line-to-line mapping, per chapter and page      |
| `book/revisions/<edition>.md`   | revisions made to an edition                    |
| `src/assets/generated/`         | built from `book/`, not committed               |
| `scripts/`                      | the generator, and the Vite plugin that runs it |

Chapters are `chapter_<number>.md` with numbered `:::section` blocks; sections are separated by blank lines. `superscription.md` and `colophon.md` are plain paragraphs under a heading.

## Development

```sh
npm install
npm run dev      # regenerates from book/ and watches it
npm run build
```

`npm run books` regenerates by hand; `npm run books:check` validates the mapping against both texts and verifies the generated output is current. A broken mapping fails the build.

Set `SITE_URL` when building for deployment to emit `sitemap.xml` and `robots.txt`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution and provenance requirements. See [AGENTS.md](./AGENTS.md) for Armenian punctuation rules, the corpus format, and mapping invariants.

## Licensing

Repository-authored software, documentation, and assets are licensed under the [MIT License](./LICENSE-MIT). Repository-authored mappings, segmentation, arrangement, database structure, and metadata are dedicated to the public domain under [CC0 1.0 Universal](./LICENSE-CC0).

See [THIRD-PARTY-NOTICES](./THIRD-PARTY-NOTICES) for the details.
