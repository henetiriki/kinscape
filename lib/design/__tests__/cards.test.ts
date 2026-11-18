import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CONTROLS } from '@ks/lib/design/bundle.mts';
import {
  CARD_IMAGES,
  CARD_WIDTHS,
  cardImage,
  cardImageWidths,
  checkPreview,
  checkReadme,
  controlReadme,
  designBullets,
  firstSentence,
  galleryHtml,
  GROUPS,
  PHONE_CARDS,
  pinnedImage,
  previewHtml,
} from '@ks/lib/design/cards.mts';
import { CARDS } from '@ks/lib/design/states.mts';

const design = readFileSync('design/DESIGN.md', 'utf8');
const card = CARDS.find(({ name }) => name === 'Toast')!;
const docs = {
  forms: [] as string[][],
  props: [
    { doc: 'Which | way.', name: 'tone', optional: false, type: "'a' | 'b'" },
    { doc: '', name: 'placed', optional: true, type: 'boolean' },
  ],
  rest: true,
  summary: 'The result of an action.',
};

describe('firstSentence', () => {
  it('ends at the first full stop followed by a space, across lines', () => {
    expect(firstSentence('The typed date.\n It checks on Enter.')).toBe(
      'The typed date.'
    );
    expect(firstSentence('A pill that\n  turns a filter on.')).toBe(
      'A pill that turns a filter on.'
    );
    expect(firstSentence('No full stop')).toBe('No full stop');
  });
});

describe('designBullets', () => {
  it('takes the bullets of the Components section by their bold name', () => {
    const bullets = designBullets(design, ['Buttons', 'Segmented control']);

    expect(bullets).toHaveLength(2);
    expect(bullets[0]).toMatch(/^- \*\*Buttons:\*\* by height/);
    expect(bullets[1]).toMatch(/^- \*\*Segmented control\*\* \(date/);
  });

  it('makes links into the repo plain text, and rejects a missing bullet or section', () => {
    expect(designBullets(design, ['Text field'])[0]).toContain(
      'Error: see Feedback and validation.'
    );
    expect(() => designBullets(design, ['Nope'])).toThrow(
      'DESIGN.md › Components has no bullet "Nope"'
    );
    expect(() => designBullets('## Brand\n', [])).toThrow(
      'DESIGN.md has no "Components" section'
    );
  });
});

describe('controlReadme', () => {
  const text = controlReadme('Toast', docs, ['- **Toast:** white.']);

  it('starts with the summary, not a heading', () => {
    expect(text.split('\n')[0]).toBe('The result of an action.');
  });

  it('holds the design bullets and a props table with escaped pipes', () => {
    expect(text).toContain('## Design\n\n- **Toast:** white.');
    expect(text).toContain('| Prop | Type | Required | Description |');
    expect(text).toContain("| `tone` | `'a' \\| 'b'` | yes | Which \\| way. |");
    expect(text).toContain('| `placed` | `boolean` | no |  |');
  });

  it('says the rest go to the element, only where there is a rest', () => {
    expect(text).toContain('The other attributes of its HTML element');
    expect(controlReadme('Toast', { ...docs, rest: false }, [])).not.toContain(
      'HTML element'
    );
  });

  it('lists the required props of each form, where the props are a union', () => {
    const forms = controlReadme('Toast', { ...docs, forms: [['a'], []] }, []);

    expect(forms).toContain(
      'It takes one of these forms. Required props: `a`; or none.'
    );
    expect(text).not.toContain('It takes one of these forms');
  });

  it('leaves out Design and Props where it has none, and needs a summary', () => {
    const bare = controlReadme(
      'Toast',
      { forms: [], props: [], rest: false, summary: 'A.' },
      []
    );

    expect(bare).toBe('A.\n');
    expect(() => controlReadme('Toast', { ...docs, summary: '' }, [])).toThrow(
      'Toast has no JSDoc summary'
    );
  });
});

describe('previewHtml', () => {
  const html = previewHtml(card);

  it('names its group and height on line 1', () => {
    expect(html.split('\n')[0]).toBe(
      '<!-- @dsCard group="Feedback" height=140 -->'
    );
  });

  it('states a width on line 1 only for a card that has one', () => {
    expect(previewHtml({ ...card, width: 1440 }).split('\n')[0]).toBe(
      '<!-- @dsCard group="Feedback" height=140 width=1440 -->'
    );
    expect(html.split('\n')[0]).not.toContain('width');
  });

  it('is a complete document, with its doctype on line 2', () => {
    expect(html.split('\n')[1]).toBe('<!doctype html>');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
  });

  it('has a root and one script that mounts the control with its states', () => {
    expect(html).toContain('<div id="root"></div>');
    expect(html.match(/<script>/gi)).toHaveLength(1);
    expect(html).toContain('window.KinScape["Toast"]');
    expect(html).toContain('"label":"Toast · error"');
    expect(html).toContain('["onDismiss"]');
  });

  it('gives each caption an id, so a control can take its name from it', () => {
    expect(html).toContain("id: 'ks-case-' + index");
  });

  it('puts each case of a radios card in its own form, so its radios form their own group', () => {
    const radios = previewHtml({ ...card, radios: true });

    expect(radios).toContain(
      "h('form', { className: 'ks-scope', key: index, onSubmit: function (event) { event.preventDefault(); } }, h('figure',"
    );
    expect(radios).toContain('.ks-scope { display: contents; }');
    expect(html).not.toContain('ks-scope');
    expect(html).not.toContain("h('form'");
  });

  it('sets radios on the two cards that hold a radio and no other', () => {
    expect(
      CARDS.filter(({ radios }) => radios)
        .map(({ name }) => name)
        .sort()
    ).toEqual(['DateDock', 'Segmented']);
  });

  it('sets the body to the body font', () => {
    expect(html).toMatch(/body \{[^}]*font-family: var\(--font-body\);/);
  });

  it('links and fetches nothing, and passes its own check', () => {
    expect(html).not.toMatch(/<link|<script[^>]*src|https?:/);
    expect(() => checkPreview('Toast', html)).not.toThrow();
  });

  it('draws a control in a slot or in the children from window.KinScape', () => {
    const bar = CARDS.find(({ name }) => name === 'ActionBar')!;
    const header = CARDS.find(({ name }) => name === 'PageHeader')!;

    expect(previewHtml(bar)).toContain('"control":"Button"');
    expect(previewHtml(bar)).toContain('contain: layout');
    expect(previewHtml(header)).toContain('"slots":{"avatar":');
    expect(html).not.toContain('contain: layout');
  });

  it('sets the height of the control in each state only for a card with a frame', () => {
    const layout = CARDS.find(({ name }) => name === 'ColumnLayout')!;

    expect(layout.frame).toBe(480);
    expect(layout.group).toBe('Layout');
    expect(layout.width).toBe(1440);
    expect(layout.states).toHaveLength(6);
    expect(previewHtml(layout)).toContain(
      '.ks-case > :last-child { height: 480px; min-height: 0; }'
    );
    expect(previewHtml(layout).split('\n')[0]).toBe(
      '<!-- @dsCard group="Layout" height=3400 width=1440 -->'
    );
    expect(html).not.toContain(':last-child');
  });

  it('keeps text from ending the script', () => {
    const tricky = previewHtml({
      ...card,
      states: [{ children: '</script><!--', label: 'x', props: {} }],
    });

    expect(tricky.match(/<\/script>/gi)).toHaveLength(1);
    expect(tricky).not.toContain('<!--</');
  });
});

describe('galleryHtml', () => {
  const preview = previewHtml(card);
  const gallery = galleryHtml(preview);
  const head = gallery.split('<head>\n')[1];

  it('removes the card comment on line 1 and keeps the doctype first', () => {
    expect(gallery).not.toContain('@dsCard');
    expect(gallery.split('\n')[0]).toBe('<!doctype html>');
  });

  it('puts the five local tags first in the head, in load order', () => {
    expect(head.split('\n').slice(0, 5)).toEqual([
      '<script src="vendor/react.development.js"></script>',
      '<script src="vendor/react-dom.development.js"></script>',
      '<link rel="stylesheet" href="../project/tokens.css" />',
      '<link rel="stylesheet" href="../project/components/bundle.css" />',
      '<script src="../project/components/bundle.js"></script>',
    ]);
    expect(head.split('\n')[5]).toBe('<meta charset="utf-8" />');
  });

  it('keeps the style, the root and the mount script of the preview', () => {
    const tags = head.split('\n').slice(0, 5).join('\n');

    expect(gallery.replace(`${tags}\n`, '')).toBe(
      preview.slice(preview.indexOf('\n') + 1)
    );
    expect(gallery).toContain('body { margin: 0; padding: 16px;');
    expect(gallery).toContain('<div id="root"></div>');
    expect(gallery).toContain('window.KinScape["Toast"]');
  });

  it('names no network address', () => {
    expect(gallery).not.toMatch(/https?:/);
  });
});

describe('checkPreview', () => {
  const ok = '<!-- @dsCard group="Forms" height=88 -->\n<div></div>';

  it('accepts a card of each group', () => {
    for (const group of GROUPS) {
      expect(() => checkPreview('A', ok.replace('Forms', group))).not.toThrow();
    }
  });

  it.each([320, 1920])('accepts a width of %s', width => {
    const html = ok.replace('88', `88 width=${width}`);

    expect(() => checkPreview('A', html)).not.toThrow();
  });

  it.each([
    ['a missing line 1', '<div></div>'],
    ['a width under 320', ok.replace('88', '88 width=319')],
    ['a width over 1920', ok.replace('88', '88 width=1921')],
    ['a width that is not whole', ok.replace('88', '88 width=390.5')],
    ['an unknown group', ok.replace('Forms', 'Other')],
    ['a height under 40', ok.replace('88', '39')],
    ['a height over 4000', ok.replace('88', '4001')],
    ['a stylesheet link', `${ok}<link rel="stylesheet" href="x.css">`],
    ['a script source', `${ok}<script src="bundle.js"></script>`],
    ['an iframe', `${ok}<iframe></iframe>`],
    ['noscript', `${ok}<noscript></noscript>`],
    ['over 256 KB', `${ok}${'x'.repeat(256 * 1024)}`],
  ])('rejects %s', (_name, html) => {
    expect(() => checkPreview('A', html)).toThrow(/^A preview\.html /);
  });
});

describe('checkReadme', () => {
  it('rejects a leading # heading, an empty first line and 64 KB or more', () => {
    expect(() => checkReadme('A', 'A summary.\n')).not.toThrow();
    expect(() => checkReadme('A', '# A\n\nA summary.')).toThrow(
      'A README.md starts with a heading'
    );
    expect(() => checkReadme('A', '\nA summary.')).toThrow(
      'A README.md starts with a heading'
    );
    expect(() => checkReadme('A', 'x'.repeat(64 * 1024 + 1))).toThrow(
      'A README.md is over 64 KB'
    );
  });
});

describe('cardImage', () => {
  it('names the image of a card at a width', () => {
    expect(CARD_WIDTHS).toEqual([1440, 390]);
    expect(cardImage('Button', 1440)).toBe('Button-1440.png');
    expect(cardImage('Button', 390)).toBe('Button-390.png');
  });
});

/** The files of `CARD_IMAGES` that are not the image of one of the cards at a width of its own. */
const strayCardImages = (files: string[], names: string[]): string[] => {
  const wanted = new Set(
    names.flatMap(name =>
      cardImageWidths(name).map(width => cardImage(name, width))
    )
  );

  return files.filter(file => !wanted.has(file)).toSorted();
};

/** CSS that makes a component change with the viewport width. A fixed overlay with no such rule is listed by hand. */
const WIDTH_RULE =
  /@media[^{]*(?:(?:min|max)-width|\bwidth\s*[<>])|@container|\d(?:dvh|dvw|lvh|lvw|svh|svw|vh|vw)\b/;

describe('the width rule of a component', () => {
  it.each([
    '@media (min-width: 640px) { a { top: 0 } }',
    '@media (max-width: 639.98px), (max-height: 499.98px) { a { top: 0 } }',
    '@media (width <= 640px) { a { top: 0 } }',
    '@media (width > 640px) { a { top: 0 } }',
    '@container (inline-size > 20em) { a { top: 0 } }',
    'a { max-height: calc(100dvh - 80px); }',
    'a { width: 90vw; }',
  ])('matches %s', css => {
    expect(WIDTH_RULE.test(css)).toBe(true);
  });

  it.each([
    '@media (hover: hover) { a { top: 0 } }',
    '@media (prefers-reduced-motion: no-preference) { a { top: 0 } }',
    'a { width: 100%; inset: 0; }',
    'a { line-height: 1.5; }',
  ])('does not match %s', css => {
    expect(WIDTH_RULE.test(css)).toBe(false);
  });
});

describe('cardImageWidths', () => {
  it('is the desktop width for a card, and the phone width too for a card in PHONE_CARDS', () => {
    expect(cardImageWidths('Divider')).toEqual([1440]);
    expect(cardImageWidths('Chip')).toEqual([1440, 390]);
  });

  it('names only cards that exist', () => {
    const names = CARDS.map(({ name }) => name);

    expect(PHONE_CARDS.filter(name => !names.includes(name))).toEqual([]);
  });

  it('names each card whose component CSS has a width rule', () => {
    const files = readdirSync('app/components', { recursive: true }).map(
      String
    );
    const responsive = CARDS.map(({ name }) => name).filter(name =>
      files
        .filter(file => file.endsWith(`/${name}.module.css`))
        .some(file =>
          WIDTH_RULE.test(readFileSync(`app/components/${file}`, 'utf8'))
        )
    );

    expect(responsive.filter(name => !PHONE_CARDS.includes(name))).toEqual([]);
    expect(responsive.length).toBeGreaterThan(0);
  });
});

describe('strayCardImages', () => {
  const names = ['Alert', 'Chip'];
  const wanted = names.flatMap(name =>
    cardImageWidths(name).map(width => cardImage(name, width))
  );

  it('is empty when each file is the image of a card at a width', () => {
    expect(strayCardImages(wanted, names)).toEqual([]);
    expect(strayCardImages(wanted.slice(1), names)).toEqual([]);
  });

  it('lists, in order, each file that is not the image of a card at a width', () => {
    expect(
      strayCardImages(
        [
          ...wanted,
          'Zebra-1440.png',
          'Alert-390.png',
          'Chip-800.png',
          'Chip-390.jpg',
          'notes.md',
        ],
        names
      )
    ).toEqual([
      'Alert-390.png',
      'Chip-390.jpg',
      'Chip-800.png',
      'Zebra-1440.png',
      'notes.md',
    ]);
  });
});

describe('pinnedImage', () => {
  it('is true only where PLAYWRIGHT_BROWSERS_PATH is /ms-playwright', () => {
    expect(pinnedImage({ PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright' })).toBe(
      true
    );
    expect(pinnedImage({ PLAYWRIGHT_BROWSERS_PATH: '/home/me/.cache' })).toBe(
      false
    );
    expect(pinnedImage({})).toBe(false);
  });
});

describe('the card images', () => {
  it('hold no file that is not the image of a card at a width', () => {
    const files = existsSync(CARD_IMAGES) ? readdirSync(CARD_IMAGES) : [];
    const stray = strayCardImages(
      files,
      CARDS.map(({ name }) => name)
    );

    expect(stray.map(file => `${CARD_IMAGES}/${file}`)).toEqual([]);
  });
});

describe('CARDS', () => {
  it('has one card per control, in the order of CONTROLS', () => {
    expect(CARDS.map(({ name }) => name)).toEqual(
      CONTROLS.map(({ name }) => name)
    );
  });

  it('has the groups: 14 Actions, 6 Feedback, 8 Forms, 6 Map, 8 Foundation, 9 Overlays and 2 Layout', () => {
    const count = (group: string) =>
      CARDS.filter(card => card.group === group).length;

    expect(GROUPS.map(count)).toEqual([14, 6, 8, 6, 8, 9, 2]);
  });

  it.each(CARDS.map(card => [card.name, card] as const))(
    '%s passes its own preview check',
    (_name, each) => {
      expect(() => checkPreview(each.name, previewHtml(each))).not.toThrow();
    }
  );
});
