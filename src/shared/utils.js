// SPDX-License-Identifier: MIT

const ONES = ['', 'Ա', 'Բ', 'Գ', 'Դ', 'Ե', 'Զ', 'Է', 'Ը', 'Թ'];
const TENS = ['', 'Ժ', 'Ի', 'Լ', 'Խ', 'Ծ', 'Կ', 'Հ', 'Ձ', 'Ղ'];
const HUNDREDS = ['', 'Ճ', 'Մ', 'Յ', 'Ն', 'Շ', 'Ո', 'Չ', 'Պ', 'Ջ'];
const THOUSANDS = ['', 'Ռ', 'Ս', 'Վ', 'Տ', 'Ր', 'Ց', 'Ւ', 'Փ', 'Ք'];

// Two 100-entry tables: HI for thousands+hundreds, LO for tens+ones.
const HI = new Array(100);
const LO = new Array(100);

for (let i = 0; i < 100; i++) {
  const a = (i / 10) | 0;
  const b = i % 10;
  HI[i] = THOUSANDS[a] + HUNDREDS[b];
  LO[i] = TENS[a] + ONES[b];
}

/**
 * Integer to Armenian numerals. Limited to 1..9999: the system has no zero,
 * and anything above Ք (9000) needs the overline convention.
 *
 * @param {number} n integer in 1..9999
 * @returns {string}
 */
export function toArmenian(n) {
  if (!Number.isInteger(n) || n < 1 || n > 9999) {
    throw new RangeError('Expected an integer in 1..9999, got ' + n);
  }

  return HI[(n / 100) | 0] + LO[n % 100];
}

/**
 * The integers from `start` to `end`, inclusive.
 *
 * @param {number} start
 * @param {number} end
 * @returns {number[]}
 */
export function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
