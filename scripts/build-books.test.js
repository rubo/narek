// The corpus only ever proves what is accepted. These cover what must be
// rejected, because a miss here corrupts the text silently.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPunctuation, parse, readSections } from './build-books.js';

const chapter = (...lines) =>
  new Map([['original/chapters.json', [{ chapter: 42, heading: ['Գլուխ'], sections: [lines] }]]]);

const page = (heading, ...content) => new Map([['original/prologue.json', { heading, content }]]);

const only = (outputs) => {
  const problems = checkPunctuation(outputs);
  assert.equal(problems.length, 1, `expected one problem, got ${problems.length}`);
  return problems[0];
};

test('accepts the marks the corpus actually uses', () => {
  const text = 'Աստուած, ողորմեա՛ ինձ. եւ քաւեա՜ զիս՝ ամենակալ ։ «բան» – (այս) ֊ …';
  assert.deepEqual(checkPunctuation(chapter(text)), []);
});

test('rejects each confusable with the mark it should have been', () => {
  const expected = [
    [':', 'վերջակետ ։ (U+0589)'],
    ['`', 'բութ ՝ (U+055D)'],
    ['~', 'բացականչական ՜ (U+055C)'],
    ["'", 'շեշտ ՛ (U+055B)'],
    ['—', 'the en dash – (U+2013)'],
  ];

  for (const [ch, correct] of expected) {
    const problem = only(chapter(`Աստուած${ch} ողորմեա`));
    assert.match(problem, /§1 line 1, col 8:/u);
    assert.ok(problem.includes(`must be ${correct}`), problem);
  }
});

test('allows a hyphen only where it joins word material', () => {
  assert.deepEqual(checkPunctuation(chapter('երդմնականաւ Ամէն-իւն')), []);
  // A quoted stem can take a suffix.
  assert.deepEqual(checkPunctuation(chapter('խոստումով «Ամեն»-ի երդմամբ')), []);
});

test('rejects a hyphen doing the work of a dash', () => {
  assert.match(only(chapter('Եսայեայ,-')), /on dash duty — dashes are – \(U\+2013\)/u);
  assert.match(only(chapter('Եսայեայ -')), /on dash duty/u);
  assert.match(only(chapter('Եսայեայ - բան')), /on dash duty/u);
});

test('rejects a code point nobody listed as a mistake', () => {
  // A Latin o inside an Armenian word: the allowlist is what catches this.
  assert.match(only(chapter('Աստուoած')), /unexpected U\+006F/u);
});

test('reports a supplementary-plane character once, not as two surrogates', () => {
  const problem = only(chapter('Աբ😀գ'));
  assert.match(problem, /col 3: unexpected U\+1F600/u);
  assert.ok(!problem.includes('U+D83D'), problem);
});

test('checks chapter headings, not only sections', () => {
  const outputs = new Map([
    ['original/chapters.json', [{ chapter: 42, heading: ['Գլուխ:'], sections: [['Աստուած']] }]],
  ]);

  assert.match(only(outputs), /heading 1, col 6: ':'/u);
});

test('checks standalone pages, both heading and content', () => {
  assert.match(only(page('Յառաջաբան:', 'Աստուած')), /heading, col 10:/u);
  assert.match(only(page('Յառաջաբան', 'Աստուա`ծ')), /line 1, col 7:/u);
});

test('rejects a colon touching a letter, which parse would otherwise swallow', () => {
  assert.throws(() => readSections(parse('Աստուած:ողորմեա'), 'x.md'), /stray ':' before/u);
});

test('a swallowed word is why that guard exists', () => {
  // Without the guard the colon and the word after it vanish from the output,
  // leaving nothing for checkPunctuation to find.
  const [paragraph] = parse('Աստուած:ողորմեա').children;
  assert.ok(paragraph.children.some((child) => child.type === 'textDirective'));
});

test('a colon before a space survives parsing and is caught as text', () => {
  assert.deepEqual(readSections(parse('Աստուած: ողորմեա'), 'x.md'), ['Աստուած: ողորմեա']);
  assert.match(only(chapter('Աստուած: ողորմեա')), /must be վերջակետ/u);
});

test('reports every bad character in a line, not just the first', () => {
  assert.equal(checkPunctuation(chapter('Աստ`ուած~ողորմեա')).length, 2);
});
