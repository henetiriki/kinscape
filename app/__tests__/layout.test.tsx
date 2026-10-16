import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

import RootLayout, { metadata } from '../layout';

it('wraps the children in an English document', () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <p>child</p>
    </RootLayout>
  );

  expect(html).toContain('<html lang="en">');
  expect(html).toContain('<body><p>child</p></body>');
});

// NFR-03
it('asks search engines not to index or follow', () => {
  expect(metadata.robots).toEqual({ follow: false, index: false });
});
