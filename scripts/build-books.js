// SPDX-License-Identifier: MIT

// Builds src/assets/generated/ from the Markdown in book/.
// --check verifies the output is current instead of writing it.

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toString } from 'mdast-util-to-string';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(root, 'book');
const outputRoot = join(root, 'src', 'assets', 'generated');
// Sitemap URLs are absolute, so without a host there is nothing to emit.
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/u, '');

// One entry per edition. Output mirrors book/<source>/, with the chapters
// collected into chapters.json.
const sources = ['original', 'translation_mk'];

const CHAPTER_FILE = /^chapter_(\d+)\.md$/;

// mapping_<edition> pairs original with translation_<edition>.
const MAPPING_DIR = /^mapping_(.+)$/u;
const MAPPING_CHAPTER = /^chapter_(\d+)\.json$/u;
const MAPPING_PAGE = /^(.+)\.json$/u;
const MAPPING_MODES = new Set(['line', 'block']);

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkDirective);

class BuildError extends Error {
  constructor(file, node, message) {
    super(`${file}:${node?.position?.start?.line ?? 1}: ${message}`);
    this.name = 'BuildError';
  }
}

// Exported for build-books.test.js, which exercises the rejection paths the
// corpus itself cannot: a clean corpus only proves what is accepted.
export function parse(text) {
  const tree = processor.parse(text);
  return processor.runSync(tree);
}

export function mappingFilenameProblem(file) {
  if (!MAPPING_PAGE.test(file)) {
    return 'expected a JSON mapping file';
  }

  // A chapter_* name that fails the numeric pattern is a malformed chapter,
  // not a standalone page with a coincidentally similar name.
  if (file.startsWith('chapter_') && !MAPPING_CHAPTER.test(file)) {
    return 'expected chapter_<n>.json';
  }

  return null;
}

// toString drops directive names and hard-break separators, silently deleting
// a word or fusing two. Reject both before extraction.
function checkInline(node, file) {
  if (node.type === 'textDirective' || node.type === 'leafDirective') {
    throw new BuildError(
      file,
      node,
      `stray ':' before '${node.name}' — sentences end with ։ (U+0589)`,
    );
  }

  if (node.type === 'break') {
    throw new BuildError(
      file,
      node,
      'hard line break — end the line after its last character, with no trailing spaces or backslash',
    );
  }

  for (const child of node.children ?? []) {
    checkInline(child, file);
  }
}

// Preserve soft breaks until the section reader decides whether they are valid.
function readParagraphs(parent, file) {
  const paragraphs = [];

  for (const child of parent.children) {
    if (child.type === 'yaml') continue;

    if (child.type !== 'paragraph' || child.data?.directiveLabel) {
      throw new BuildError(file, child, `unexpected ${child.type} where a section was expected`);
    }

    checkInline(child, file);
    paragraphs.push({ node: child, text: toString(child) });
  }

  return paragraphs;
}

// Outside prose, each paragraph is one extracted line and cannot be reflowed.
export function readSections(parent, file) {
  const sections = [];

  for (const { node, text } of readParagraphs(parent, file)) {
    if (text.includes('\n')) {
      throw new BuildError(
        file,
        node,
        'line break inside a paragraph — breaks divide lines only in a {prose} section',
      );
    }

    const section = text.replaceAll(/\s+/gu, ' ').trim();

    if (!section) {
      throw new BuildError(file, node, 'empty section');
    }

    sections.push(section);
  }

  return sections;
}

// In prose, soft breaks divide lines and blank lines remain paragraphs.
export function readProse(parent, file) {
  const lines = [];
  const paragraphs = [];

  for (const { node, text } of readParagraphs(parent, file)) {
    paragraphs.push(lines.length);

    for (const part of text.split('\n')) {
      const line = part.replaceAll(/\s+/gu, ' ').trim();

      if (!line) {
        throw new BuildError(file, node, 'empty line in a prose section');
      }

      lines.push(line);
    }
  }

  return { lines, paragraphs };
}

function readFrontMatter(tree, file) {
  const [node] = tree.children;

  if (node?.type !== 'yaml') {
    throw new BuildError(file, node, 'missing front matter');
  }

  const data = parseYaml(node.value);

  if (data === null || typeof data !== 'object') {
    throw new BuildError(file, node, 'front matter must be a mapping');
  }

  return { data, node };
}

// Read :::section blocks in order; prose sections also record paragraph starts.
function readDirectives(tree, file) {
  const sections = [];
  const prose = [];

  for (const node of tree.children.slice(1)) {
    if (node.type !== 'containerDirective' || node.name !== 'section') {
      throw new BuildError(file, node, `expected a :::section, got ${node.name ?? node.type}`);
    }

    const number = Number(node.attributes?.number);

    if (number !== sections.length + 1) {
      throw new BuildError(
        file,
        node,
        `expected section ${sections.length + 1}, got ${node.attributes?.number}`,
      );
    }

    const marker = node.attributes?.prose;

    // {prose=false} would read as prose, so the flag takes no value at all.
    if (marker !== undefined && marker !== '') {
      throw new BuildError(file, node, `prose takes no value, got ${JSON.stringify(marker)}`);
    }

    const { lines, paragraphs } =
      marker === undefined
        ? { lines: readSections(node, file), paragraphs: null }
        : readProse(node, file);

    if (lines.length === 0) {
      throw new BuildError(file, node, 'empty section');
    }

    sections.push(lines);
    prose.push(paragraphs);
  }

  if (sections.length === 0) {
    throw new BuildError(file, tree, 'no sections');
  }

  return { sections, prose: prose.some(Boolean) ? prose : null };
}

export function buildChapter(tree, file, number) {
  const { data, node } = readFrontMatter(tree, file);

  if (data.number !== number) {
    throw new BuildError(
      file,
      node,
      `front matter number ${data.number} does not match the file name`,
    );
  }

  const heading = Array.isArray(data.heading) ? data.heading : [data.heading];

  if (heading.some((h) => typeof h !== 'string' || !h.trim())) {
    throw new BuildError(file, node, 'missing heading');
  }

  const { sections, prose } = readDirectives(tree, file);

  // Avoid an all-null prose array on chapters with no prose section.
  return prose
    ? { chapter: number, heading, prose, sections }
    : { chapter: number, heading, sections };
}

// A standalone page such as the superscription: paragraphs under one heading.
function buildPage(tree, file) {
  const { data, node } = readFrontMatter(tree, file);

  if (typeof data.heading !== 'string' || !data.heading.trim()) {
    throw new BuildError(file, node, 'heading must be a single line');
  }

  const content = readSections(tree, file);

  if (content.length === 0) {
    throw new BuildError(file, node, 'no content');
  }

  return { heading: data.heading, content };
}

async function buildSource(source, outputs) {
  const dir = join(sourceRoot, source);
  const files = (await readdir(dir)).filter((file) => file.endsWith('.md')).sort();
  const chapters = [];

  for (const file of files) {
    const path = join(dir, file);
    const label = relative(root, path).replaceAll('\\', '/');
    const tree = parse(await readFile(path, 'utf8'));
    const match = CHAPTER_FILE.exec(file);

    if (match) {
      chapters.push(buildChapter(tree, label, Number(match[1])));
      continue;
    }

    // Not a chapter: superscription.md becomes superscription.json.
    outputs.set(`${source}/${file.replace(/\.md$/u, '.json')}`, buildPage(tree, label));
  }

  chapters.sort((a, b) => a.chapter - b.chapter);
  outputs.set(`${source}/chapters.json`, chapters);
}

const span = (range) =>
  Array.isArray(range) && range.length === 2 && range.every(Number.isInteger)
    ? range[1] - range[0] + 1
    : null;

// Every line must be covered exactly once, or the combined view drops or
// repeats text.
function checkCoverage(where, pairs, key, count, problems) {
  const seen = new Array(count).fill(0);

  for (const pair of pairs) {
    const range = pair[key];

    if (span(range) === null || range[0] > range[1]) {
      problems.push(`${where}: malformed ${key} range ${JSON.stringify(range)}`);
      continue;
    }

    if (range[0] < 0 || range[1] >= count) {
      problems.push(`${where}: ${key} range ${range[0]}-${range[1]} is outside 0-${count - 1}`);
      continue;
    }

    for (let line = range[0]; line <= range[1]; line++) {
      seen[line]++;
    }
  }

  const missing = seen.flatMap((times, line) => (times === 0 ? [line] : []));
  const repeated = seen.flatMap((times, line) => (times > 1 ? [line] : []));

  if (missing.length > 0) {
    problems.push(`${where}: ${key} lines never mapped: ${missing.join(', ')}`);
  }

  if (repeated.length > 0) {
    problems.push(`${where}: ${key} lines mapped more than once: ${repeated.join(', ')}`);
  }
}

// Each pair list must cover both texts exactly once.
function checkPairs(where, pairs, originalCount, translationCount, problems) {
  for (const pair of pairs) {
    if (!MAPPING_MODES.has(pair.mode)) {
      problems.push(`${where}: unknown mode ${JSON.stringify(pair.mode)}`);
      continue;
    }

    // `line` pairs the ranges position by position, so lengths must match.
    const lines = span(pair.original);
    const translatedLines = span(pair.translation);

    if (pair.mode === 'line' && lines !== null && lines !== translatedLines) {
      problems.push(
        `${where}: line mode maps ${lines} original lines onto ${translatedLines} translation lines`,
      );
    }
  }

  if (originalCount !== undefined) {
    checkCoverage(where, pairs, 'original', originalCount, problems);
  }

  if (translationCount !== undefined) {
    checkCoverage(where, pairs, 'translation', translationCount, problems);
  }
}

// Exported to test rejection paths that a valid corpus cannot exercise.
export function checkMapping(file, mapping, original, translation) {
  const problems = [];
  const byChapter = (chapters) => new Map(chapters.map((entry) => [entry.chapter, entry]));
  const originalChapters = byChapter(original);
  const translationChapters = byChapter(translation);

  for (const { chapter } of original) {
    if (!mapping.some((entry) => entry.chapter === chapter)) {
      problems.push(`${file}: chapter ${chapter} has no mapping`);
    }
  }

  for (const entry of mapping) {
    const chapter = originalChapters.get(entry.chapter);
    const translated = translationChapters.get(entry.chapter);
    const label = `${file}: chapter ${entry.chapter}`;

    if (!chapter || !translated) {
      problems.push(`${label} is missing from the ${chapter ? 'translation' : 'original'}`);
      continue;
    }

    if (Array.isArray(entry.heading)) {
      checkPairs(
        `${label} heading`,
        entry.heading,
        chapter.heading.length,
        translated.heading.length,
        problems,
      );
    } else {
      problems.push(`${label}: missing heading mapping`);
    }

    if (chapter.sections.length !== translated.sections.length) {
      problems.push(
        `${label}: ${chapter.sections.length} sections in the original, ${translated.sections.length} in the translation`,
      );
    }

    if (entry.sections.length !== chapter.sections.length) {
      problems.push(
        `${label}: ${entry.sections.length} mapped sections, ${chapter.sections.length} in the original`,
      );
    }

    entry.sections.forEach((pairs, index) => {
      checkPairs(
        `${label} section ${index + 1}`,
        pairs,
        chapter.sections[index]?.length,
        translated.sections[index]?.length,
        problems,
      );
    });
  }

  return problems;
}

// Standalone pages use the same exact-coverage contract as chapter headings and
// sections, with their paragraphs mapped under `content`.
export function checkPageMapping(file, mapping, original, translation) {
  const problems = [];

  for (const key of ['heading', 'content']) {
    if (Array.isArray(mapping[key])) {
      checkPairs(
        `${file} ${key}`,
        mapping[key],
        key === 'heading' ? 1 : original.content.length,
        key === 'heading' ? 1 : translation.content.length,
        problems,
      );
    } else {
      problems.push(`${file}: missing ${key} mapping`);
    }
  }

  return problems;
}

// Keep chapter mappings aligned with the chapter arrays and retain standalone
// page mappings by their matching file names.
async function readMapping(edition, original) {
  const dir = join(sourceRoot, `mapping_${edition}`);
  const byChapter = new Map();
  const pages = new Map();
  const problems = [];

  for (const file of (await readdir(dir)).sort()) {
    const filenameProblem = mappingFilenameProblem(file);

    if (filenameProblem) {
      problems.push(`mapping_${edition}/${file}: ${filenameProblem}`);
      continue;
    }

    const chapterMatch = MAPPING_CHAPTER.exec(file);
    const pageMatch = MAPPING_PAGE.exec(file);

    let entry;

    try {
      entry = JSON.parse(await readFile(join(dir, file), 'utf8'));
    } catch (error) {
      problems.push(`mapping_${edition}/${file}: ${error.message}`);
      continue;
    }

    if (!chapterMatch) {
      pages.set(pageMatch[1], { entry, file });
      continue;
    }

    if (entry.chapter !== Number(chapterMatch[1])) {
      problems.push(
        `mapping_${edition}/${file}: chapter ${entry.chapter} does not match the file name`,
      );
    }

    const seen = byChapter.get(entry.chapter);

    if (seen) {
      problems.push(
        `mapping_${edition}/${file}: chapter ${entry.chapter} already mapped by ${seen.file}`,
      );
      continue;
    }

    byChapter.set(entry.chapter, { entry, file });
  }

  const merged = original.map(({ chapter }) => byChapter.get(chapter)?.entry ?? null);

  return {
    merged,
    chapters: [...byChapter.values()].map((seen) => seen.entry),
    pages,
    problems,
  };
}

async function emitMappings(outputs) {
  const dirents = (await readdir(sourceRoot, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const original = outputs.get('original/chapters.json');
  const problems = [];

  for (const dirent of dirents) {
    const match = dirent.isDirectory() ? MAPPING_DIR.exec(dirent.name) : null;

    if (!match) {
      continue;
    }

    const edition = match[1];
    const label = `mapping_${edition}`;
    const translation = outputs.get(`translation_${edition}/chapters.json`);

    if (!translation) {
      problems.push(`${label}: there is no book/translation_${edition} to map onto`);
      continue;
    }

    const {
      merged,
      chapters,
      pages,
      problems: readProblems,
    } = await readMapping(edition, original);
    const pageProblems = [];

    for (const [page, { entry, file }] of pages) {
      const originalPage = outputs.get(`original/${page}.json`);
      const translationPage = outputs.get(`translation_${edition}/${page}.json`);

      if (!originalPage || !translationPage) {
        pageProblems.push(
          `${label}/${file}: ${page}.md is missing from the ${originalPage ? 'translation' : 'original'}`,
        );
        continue;
      }

      pageProblems.push(
        ...checkPageMapping(`${label}: ${page}`, entry, originalPage, translationPage),
      );
    }

    const editionProblems = [
      ...readProblems,
      ...checkMapping(label, chapters, original, translation),
      ...pageProblems,
    ];

    problems.push(...editionProblems);

    // Keep invalid mappings out of the app; dev serves the last valid output.
    if (editionProblems.length === 0) {
      outputs.set(`${label}.json`, merged);

      for (const { entry, file } of pages.values()) {
        outputs.set(`${label}/${file}`, entry);
      }
    }
  }

  return problems;
}

// Keep mapping ranges in compact [start, end] form.
function serialize(name, value) {
  const json = JSON.stringify(value, null, 2);
  const text = name.startsWith('mapping_')
    ? json.replace(/\[\s+(\d+),\s+(\d+)\s+\]/gu, '[$1, $2]')
    : json;

  return `${text}\n`;
}

// Latin marks close enough in shape to their Armenian counterparts that a wrong
// one still reads as correct.
const CONFUSABLE = new Map([
  [':', 'վերջակետ ։ (U+0589)'],
  ['`', 'բութ ՝ (U+055D)'],
  ['~', 'բացականչական ՜ (U+055C)'],
  ["'", 'շեշտ ՛ (U+055B)'],
  ['–', 'the em dash — (U+2014)'],
]);

// Shared punctuation. ASCII hyphen is validated contextually by joinsWords.
const SHARED = new Set(' ,.«»…—()[]');

function allowed(ch) {
  const cp = ch.codePointAt(0);

  return (
    (cp >= 0x531 && cp <= 0x556) || // capitals
    (cp >= 0x561 && cp <= 0x587) || // lowercase, through the ligature և
    (cp >= 0x55a && cp <= 0x55e) || // ՚ ՛ ՜ ՝ ՞
    cp === 0x589 || // ։
    cp === 0x58a || // ֊
    SHARED.has(ch)
  );
}

// Indexed by code point, not code unit, so the window never splits a surrogate
// pair. Only reached when something is already wrong.
function excerpt(text, at) {
  const chars = [...text];
  const from = Math.max(0, at - 20);
  const to = Math.min(chars.length, at + 21);

  return `${from > 0 ? '…' : ''}${chars.slice(from, to).join('')}${to < chars.length ? '…' : ''}`;
}

const isLetter = (ch) => {
  const cp = ch?.codePointAt(0) ?? 0;

  return (cp >= 0x531 && cp <= 0x556) || (cp >= 0x561 && cp <= 0x587);
};

// Hyphens join Armenian word material: Ամէն-իւն, «Ամեն»-ի.
const joinsWords = (chars, i) => {
  const before = chars[i - 1];

  return (isLetter(before) || before === '»') && isLetter(chars[i + 1]);
};

// Code-point indexing keeps supplementary characters and columns intact.
function checkText(label, where, text, problems) {
  const chars = [...text];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const at = `${label} ${where}, col ${i + 1}`;

    if (ch === '-') {
      if (!joinsWords(chars, i)) {
        problems.push(
          `${at}: '-' U+002D on dash duty — dashes are — (U+2014); a hyphen only joins word material\n  ${excerpt(text, i)}`,
        );
      }

      continue;
    }

    if (allowed(ch)) {
      continue;
    }

    const correct = CONFUSABLE.get(ch);
    const code = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
    const detail = correct ? `'${ch}' ${code} — must be ${correct}` : `unexpected ${code}`;

    problems.push(`${at}: ${detail}\n  ${excerpt(text, i)}`);
  }
}

// Runs on the extracted strings, so front matter keys and :::section fences are
// out of scope: their ASCII colons are file syntax, not text.
export function checkPunctuation(outputs) {
  const problems = [];

  for (const [name, value] of outputs) {
    const [source, file] = name.split('/');

    if (file !== 'chapters.json') {
      const label = `book/${source}/${file.replace(/\.json$/u, '.md')}`;

      checkText(label, 'heading', value.heading, problems);

      for (const [i, line] of value.content.entries()) {
        checkText(label, `line ${i + 1}`, line, problems);
      }

      continue;
    }

    for (const { chapter, heading, sections } of value) {
      const label = `book/${source}/chapter_${chapter}.md`;

      for (const [i, line] of heading.entries()) {
        checkText(label, `heading ${i + 1}`, line, problems);
      }

      for (const [s, lines] of sections.entries()) {
        for (const [i, line] of lines.entries()) {
          checkText(label, `§${s + 1} line ${i + 1}`, line, problems);
        }
      }
    }
  }

  return problems;
}

// The routes App.jsx serves. Only the original is routed: a translation is a
// display mode, not a URL.
function renderSitemap(outputs) {
  const routes = ['/'];

  for (const { chapter } of outputs.get('original/chapters.json')) {
    routes.push(`/chapter/${chapter}`);
  }

  for (const name of outputs.keys()) {
    const page = /^original\/(.+)\.json$/u.exec(name)?.[1];

    if (page && page !== 'chapters' && page !== 'superscription') {
      routes.push(`/${page}`);
    }
  }

  const urls = routes.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// Points crawlers at the sitemap.
function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

// Build-only: the plugin emits these into the bundle, so they never reach
// public/ and are never committed.
function renderSiteAssets(outputs) {
  if (!siteUrl) {
    return new Map();
  }

  return new Map([
    ['sitemap.xml', renderSitemap(outputs)],
    ['robots.txt', renderRobots()],
  ]);
}

/**
 * Generates every output and reports what happened, leaving the caller to act
 * on it. `assets` are build-only files for the caller to emit.
 *
 * @param {{ check?: boolean, log?: (message: string) => void }} [options]
 * @returns {Promise<{
 *   written: string[],
 *   stale: string[],
 *   problems: string[],
 *   assets: Map<string, string>,
 * }>}
 */
export async function build({ check = false, log } = {}) {
  const outputs = new Map();

  for (const source of sources) {
    await buildSource(source, outputs);
  }

  // Before writing: corrupt text must never reach src/assets/generated/, where
  // the dev server would reload it and a failed build would leave it behind.
  const corrupt = checkPunctuation(outputs);

  if (corrupt.length > 0) {
    return { written: [], stale: [], problems: corrupt, assets: new Map() };
  }

  // Mapping problems must not block regenerating changed text.
  const problems = await emitMappings(outputs);

  const files = new Map();

  for (const [name, value] of outputs) {
    files.set(join(outputRoot, name), serialize(name, value));
  }

  const written = [];
  const stale = [];

  for (const [path, next] of files) {
    const name = relative(root, path).replaceAll('\\', '/');
    const previous = await readFile(path, 'utf8').catch(() => null);

    if (previous === next) {
      continue;
    }

    if (check) {
      stale.push(name);
      continue;
    }

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, next);
    written.push(name);
    log?.(`wrote ${name}`);
  }

  return { written, stale, problems, assets: renderSiteAssets(outputs) };
}

// CLI entry only: importing this module builds nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { stale, problems } = await build({
      check: process.argv.includes('--check'),
      log: (message) => console.log(message),
    });

    for (const name of stale) {
      console.error(`${name} is out of date`);
    }

    for (const problem of problems) {
      console.error(problem);
    }

    if (stale.length > 0 || problems.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof BuildError ? error.message : error);
    process.exit(1);
  }
}
