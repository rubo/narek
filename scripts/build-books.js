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

// Hand-written mappings: mapping_mk.json pairs original with translation_mk.
const assetRoot = join(root, 'src', 'assets');
const MAPPING_FILE = /^mapping_(.+)\.json$/u;
const MAPPING_MODES = new Set(['line', 'group']);

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

// An ASCII colon touching a letter parses as a text directive, and toString
// drops it — silently deleting the word. Only :::section is intentional here,
// so an inline directive always means a stray colon.
function checkInline(node, file) {
  if (node.type === 'textDirective' || node.type === 'leafDirective') {
    throw new BuildError(
      file,
      node,
      `stray ':' before '${node.name}' — sentences end with ։ (U+0589)`,
    );
  }

  for (const child of node.children ?? []) {
    checkInline(child, file);
  }
}

// One paragraph per section; wrapping inside it collapses to a single line.
export function readSections(parent, file) {
  const sections = [];

  for (const child of parent.children) {
    if (child.type === 'yaml') continue;

    if (child.type !== 'paragraph' || child.data?.directiveLabel) {
      throw new BuildError(file, child, `unexpected ${child.type} where a section was expected`);
    }

    checkInline(child, file);

    const section = toString(child).replaceAll(/\s+/gu, ' ').trim();

    if (!section) {
      throw new BuildError(file, child, 'empty section');
    }

    sections.push(section);
  }

  return sections;
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

// Every :::section block in the document, in order, as its own group.
function readDirectives(tree, file) {
  const directives = [];

  for (const node of tree.children.slice(1)) {
    if (node.type !== 'containerDirective' || node.name !== 'section') {
      throw new BuildError(file, node, `expected a :::section, got ${node.name ?? node.type}`);
    }

    const number = Number(node.attributes?.number);

    if (number !== directives.length + 1) {
      throw new BuildError(
        file,
        node,
        `expected section ${directives.length + 1}, got ${node.attributes?.number}`,
      );
    }

    const sections = readSections(node, file);

    if (sections.length === 0) {
      throw new BuildError(file, node, 'empty section');
    }

    directives.push(sections);
  }

  if (directives.length === 0) {
    throw new BuildError(file, tree, 'no sections');
  }

  return directives;
}

function buildChapter(tree, file, number) {
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

  return { chapter: number, heading, sections: readDirectives(tree, file) };
}

// A standalone page such as the prologue: paragraphs under one heading.
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

    // Not a chapter: prologue.md becomes prologue.json.
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
function checkCoverage(where, groups, key, count, problems) {
  const seen = new Array(count).fill(0);

  for (const group of groups) {
    const range = group[key];

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

function checkMapping(file, mapping, original, translation) {
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

    entry.sections.forEach((groups, index) => {
      const where = `${label} section ${index + 1}`;

      for (const group of groups) {
        if (!MAPPING_MODES.has(group.mode)) {
          problems.push(`${where}: unknown mode ${JSON.stringify(group.mode)}`);
          continue;
        }

        // `line` pairs the ranges position by position, so lengths must match.
        const lines = span(group.original);
        const translatedLines = span(group.translation);

        if (group.mode === 'line' && lines !== null && lines !== translatedLines) {
          problems.push(
            `${where}: line mode maps ${lines} original lines onto ${translatedLines} translation lines`,
          );
        }
      }

      if (chapter.sections[index]) {
        checkCoverage(where, groups, 'original', chapter.sections[index].length, problems);
      }

      if (translated.sections[index]) {
        checkCoverage(where, groups, 'translation', translated.sections[index].length, problems);
      }
    });
  }

  return problems;
}

async function checkMappings(outputs) {
  const files = (await readdir(assetRoot)).sort();
  const problems = [];

  for (const file of files) {
    const match = MAPPING_FILE.exec(file);

    if (!match) {
      continue;
    }

    const edition = match[1];
    const translation = outputs.get(`translation_${edition}/chapters.json`);

    if (!translation) {
      problems.push(`${file}: there is no book/translation_${edition} to map onto`);
      continue;
    }

    const mapping = JSON.parse(await readFile(join(assetRoot, file), 'utf8'));

    problems.push(
      ...checkMapping(file, mapping, outputs.get('original/chapters.json'), translation),
    );
  }

  return problems;
}

// Latin marks close enough in shape to their Armenian counterparts that a wrong
// one still reads as correct.
const CONFUSABLE = new Map([
  [':', 'վերջակետ ։ (U+0589)'],
  ['`', 'բութ ՝ (U+055D)'],
  ['~', 'բացականչական ՜ (U+055C)'],
  ["'", 'շեշտ ՛ (U+055B)'],
  ['—', 'the en dash – (U+2013)'],
]);

// Shared punctuation. ASCII hyphen is validated contextually by joinsWords.
const SHARED = new Set(' ,.«»…–()');

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
          `${at}: '-' U+002D on dash duty — dashes are – (U+2013); a hyphen only joins word material\n  ${excerpt(text, i)}`,
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

    if (page && page !== 'chapters' && page !== 'prologue') {
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

  const files = new Map();

  for (const [name, value] of outputs) {
    files.set(join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
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

  // After writing, so a corpus edit can be regenerated before the mapping is
  // brought back in line.
  const problems = await checkMappings(outputs);

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
