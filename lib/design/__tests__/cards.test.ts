import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CONTROLS } from '@ks/lib/design/bundle.mts';
import {
  checkPreview,
  checkReadme,
  controlReadme,
  designBullets,
  firstSentence,
  GROUPS,
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

  it('sets the body to the body font', () => {
    expect(html).toMatch(/body \{[^}]*font-family: var\(--font-body\);/);
  });

  it('links and fetches nothing, and passes its own check', () => {
    expect(html).not.toMatch(/<link|<script[^>]*src|https?:/);
    expect(() => checkPreview('Toast', html)).not.toThrow();
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

describe('checkPreview', () => {
  const ok = '<!-- @dsCard group="Forms" height=88 -->\n<div></div>';

  it('accepts a card of each group', () => {
    for (const group of GROUPS) {
      expect(() => checkPreview('A', ok.replace('Forms', group))).not.toThrow();
    }
  });

  it.each([
    ['a missing line 1', '<div></div>'],
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

describe('CARDS', () => {
  it('has one card per control, in the order of CONTROLS', () => {
    expect(CARDS.map(({ name }) => name)).toEqual(
      CONTROLS.map(({ name }) => name)
    );
  });

  it('has the three groups of app/components, 6 Actions, 4 Forms and 2 Feedback', () => {
    const count = (group: string) =>
      CARDS.filter(card => card.group === group).length;

    expect([count('Actions'), count('Forms'), count('Feedback')]).toEqual([
      6, 4, 2,
    ]);
  });

  it.each(CARDS.map(card => [card.name, card] as const))(
    '%s passes its own preview check',
    (_name, each) => {
      expect(() => checkPreview(each.name, previewHtml(each))).not.toThrow();
    }
  );
});
