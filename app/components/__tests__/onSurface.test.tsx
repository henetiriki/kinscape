import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const rule = (file: string, selector: string) => {
  const css = `\n${readFileSync(join(process.cwd(), 'app/components', file), 'utf8')}`;
  const start = css.indexOf(`\n${selector} {`);

  return css.slice(start, css.indexOf('}', start));
};

// NFR-06: Vitest doesn't resolve `composes:`, so the rules are read as text.
it.each([
  ['map/LayersPanel.module.css', '.panel', 'raised', '@/'],
  ['map/DateDock.module.css', '.dock', 'raised', '@/'],
  ['feedback/Toast.module.css', '.toast', 'floating', '@ks/'],
])(
  '%s sets %s at the %s level and draws no background, radius or shadow',
  (file, selector, level, alias) => {
    const body = rule(file, selector);

    expect(body).toContain(
      `composes: ${level} from '${alias}app/components/foundation/Surface.module.css'`
    );
    expect(body).not.toMatch(/background|border-radius|box-shadow/);
  }
);

it('keeps the shared Toast shape free of its own radius', () => {
  expect(rule('feedback/Toast.module.css', '.shape')).not.toContain(
    'border-radius'
  );
});
