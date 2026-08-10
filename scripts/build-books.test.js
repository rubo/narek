// The corpus only ever proves what is accepted. These cover what must be
// rejected, because a miss here corrupts the text silently.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkMapping, checkPunctuation, parse, readSections } from './build-books.js';

const chapter = (...lines) =>
  new Map([['original/chapters.json', [{ chapter: 42, heading: ['Գլուխ'], sections: [lines] }]]]);

const page = (heading, ...content) =>
  new Map([['original/superscription.json', { heading, content }]]);

const only = (outputs) => {
  const problems = checkPunctuation(outputs);
  assert.equal(problems.length, 1, `expected one problem, got ${problems.length}`);
  return problems[0];
};

test('accepts the marks the corpus actually uses', () => {
  const text = 'Բառ, կարդա՛ հիմա. եւ գրեա՜ տող՝ դարձեալ ։ «գիրք» — (այս) ֊ …';
  assert.deepEqual(checkPunctuation(chapter(text)), []);
});

test('rejects each confusable with the mark it should have been', () => {
  const expected = [
    [':', 'վերջակետ ։ (U+0589)'],
    ['`', 'բութ ՝ (U+055D)'],
    ['~', 'բացականչական ՜ (U+055C)'],
    ["'", 'շեշտ ՛ (U+055B)'],
    ['–', 'the em dash — (U+2014)'],
  ];

  for (const [ch, correct] of expected) {
    const problem = only(chapter(`բառ${ch} տող`));
    assert.match(problem, /§1 line 1, col 4:/u);
    assert.ok(problem.includes(`must be ${correct}`), problem);
  }
});

test('allows a hyphen only where it joins word material', () => {
  assert.deepEqual(checkPunctuation(chapter('երկու-երեք բառ')), []);
  // A quoted stem can take a suffix.
  assert.deepEqual(checkPunctuation(chapter('գրքում «բառ»-ի օրինակ')), []);
});

test('rejects a hyphen doing the work of a dash', () => {
  assert.match(only(chapter('բառ,-')), /on dash duty — dashes are — \(U\+2014\)/u);
  assert.match(only(chapter('բառ -')), /on dash duty/u);
  assert.match(only(chapter('բառ - տող')), /on dash duty/u);
});

test('rejects a code point nobody listed as a mistake', () => {
  // A Latin o inside an Armenian word: the allowlist is what catches this.
  assert.match(only(chapter('բառoբառ')), /unexpected U\+006F/u);
});

test('reports a supplementary-plane character once, not as two surrogates', () => {
  const problem = only(chapter('Աբ😀գ'));
  assert.match(problem, /col 3: unexpected U\+1F600/u);
  assert.ok(!problem.includes('U+D83D'), problem);
});

test('checks chapter headings, not only sections', () => {
  const outputs = new Map([
    ['original/chapters.json', [{ chapter: 42, heading: ['Գլուխ:'], sections: [['բառ']] }]],
  ]);

  assert.match(only(outputs), /heading 1, col 6: ':'/u);
});

test('checks standalone pages, both heading and content', () => {
  assert.match(only(page('Յառաջաբան:', 'բառ')), /heading, col 10:/u);
  assert.match(only(page('Յառաջաբան', 'բա`ռ')), /line 1, col 3:/u);
});

test('rejects a colon touching a letter, which parse would otherwise swallow', () => {
  assert.throws(() => readSections(parse('բառ:տող'), 'x.md'), /stray ':' before/u);
});

test('a swallowed word is why that guard exists', () => {
  // Without the guard the colon and the word after it vanish from the output,
  // leaving nothing for checkPunctuation to find.
  const [paragraph] = parse('բառ:տող').children;
  assert.ok(paragraph.children.some((child) => child.type === 'textDirective'));
});

test('a colon before a space survives parsing and is caught as text', () => {
  assert.deepEqual(readSections(parse('բառ: տող'), 'x.md'), ['բառ: տող']);
  assert.match(only(chapter('բառ: տող')), /must be վերջակետ/u);
});

test('accepts brackets around an interpolated word', () => {
  assert.deepEqual(readSections(parse('բան [բառ] բան'), 'x.md'), ['բան [բառ] բան']);
  assert.deepEqual(checkPunctuation(chapter('բան [բառ] բան')), []);
});

test('reports every bad character in a line, not just the first', () => {
  assert.equal(checkPunctuation(chapter('բա`ռ~տող')).length, 2);
});

const mapped = (heading) => {
  const original = [{ chapter: 42, heading: ['Ա', 'Բ'], sections: [['ա', 'բ']] }];
  const translation = [{ chapter: 42, heading: ['Գ'], sections: [['գ', 'դ']] }];
  const entry = {
    chapter: 42,
    heading,
    sections: [[{ original: [0, 1], translation: [0, 1], mode: 'line' }]],
  };

  return checkMapping('mapping_mk', [entry], original, translation);
};

test('accepts a heading that covers both sides once', () => {
  assert.deepEqual(mapped([{ original: [0, 1], translation: [0, 0], mode: 'block' }]), []);
});

test('rejects a heading that leaves an original line uncovered', () => {
  const problems = mapped([{ original: [0, 0], translation: [0, 0], mode: 'line' }]);
  assert.deepEqual(problems, ['mapping_mk: chapter 42 heading: original lines never mapped: 1']);
});

test('rejects a line-mode heading whose sides differ in length', () => {
  const problems = mapped([{ original: [0, 1], translation: [0, 0], mode: 'line' }]);
  assert.match(problems[0], /heading: line mode maps 2 original lines onto 1 translation lines/u);
});

test('rejects a mapping with no heading at all', () => {
  assert.deepEqual(mapped(undefined), ['mapping_mk: chapter 42: missing heading mapping']);
});
