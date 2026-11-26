import type { Page } from '@playwright/test';

/**
 * Runs before each page loads, and again after a reload. A constructed style sheet is not a DOM node,
 * so React hydration of `<html>` cannot remove it, and it wins a tie with the page's own rules.
 */
export const LARGE_TEXT = `
  (() => {
    const sheet = new CSSStyleSheet();

    sheet.replaceSync('html { font-size: 200% }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  })();
`;

/**
 * The elements that cut off their own text: visible, over 1 × 1px, with `overflow` of `hidden` or
 * `clip` on an axis, and a text of their own that passes their padding box on that axis by over 1px.
 * Each problem names the element (tag and first class), the axis and the amount. It holds no page text.
 */
export const cutOffNow = (page: Page) =>
  page.evaluate(() => {
    const CUTS = ['hidden', 'clip'];
    const WORD = /[\p{L}\p{N}]/u;
    const problems: string[] = [];

    for (const node of document.body.querySelectorAll('*')) {
      const own = [...node.childNodes].filter(
        child =>
          child.nodeType === Node.TEXT_NODE &&
          WORD.test(child.textContent ?? '')
      );

      if (own.length === 0 || !node.checkVisibility()) continue;

      const box = node.getBoundingClientRect();

      if (box.width <= 1 || box.height <= 1) continue;

      const style = getComputedStyle(node);
      const range = document.createRange();

      range.setStartBefore(own[0]);
      range.setEndAfter(own.at(-1)!);

      const text = range.getBoundingClientRect();
      const name = `${node.tagName.toLowerCase()}.${String(node.getAttribute('class')).split(' ')[0]}`;
      const axes = [
        {
          axis: 'x',
          by: Math.max(
            box.left + node.clientLeft - text.left,
            text.right - (box.left + node.clientLeft + node.clientWidth)
          ),
          cuts: CUTS.includes(style.overflowX),
        },
        {
          axis: 'y',
          by: Math.max(
            box.top + node.clientTop - text.top,
            text.bottom - (box.top + node.clientTop + node.clientHeight)
          ),
          cuts: CUTS.includes(style.overflowY),
        },
      ];

      for (const { axis, by, cuts } of axes) {
        if (cuts && by > 1) {
          problems.push(
            `${name}: text cut off on ${axis} by ${Math.round(by)}px`
          );
        }
      }
    }

    return problems;
  });
