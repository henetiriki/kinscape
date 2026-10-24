import type { Metadata } from 'next';

import localFont from 'next/font/local';

import './tokens.css';
import './globals.css';

// The @fontsource files design/source/fonts.css uses, served by KinScape (NFR-03).
// Each variable is the one tokens.css starts that font's stack with.
// next/font reads these options statically, so they stay literals: no helpers or templates.
// The unicode-ranges are the ones in the @fontsource packages' own CSS. Each latin-ext call
// declares the family name next/font gives its latin call, so one family holds both ranges.
const bricolage = localFont({
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
  src: [
    {
      path: '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
      style: 'normal',
      weight: '200 800',
    },
  ],
  variable: '--next-font-bricolage-grotesque',
});

const bricolageLatinExt = localFont({
  declarations: [
    { prop: 'font-family', value: "'bricolage'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
  src: [
    {
      path: '../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-wght-normal.woff2',
      style: 'normal',
      weight: '200 800',
    },
  ],
});

const publicSans = localFont({
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    },
  ],
  src: [
    {
      path: '../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: '../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--next-font-public-sans',
});

const publicSansLatinExt = localFont({
  declarations: [
    { prop: 'font-family', value: "'publicSans'" },
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    },
  ],
  src: [
    {
      path: '../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-ext-wght-normal.woff2',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: '../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-ext-wght-italic.woff2',
      style: 'italic',
      weight: '100 900',
    },
  ],
});

const jetbrainsMono = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
      style: 'normal',
      weight: '400',
    },
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2',
      style: 'normal',
      weight: '500',
    },
  ],
  variable: '--next-font-jetbrains-mono',
});

// The latin-ext faces register through their calls; nothing else reads them.
void [bricolageLatinExt, publicSansLatinExt];

export const metadata: Metadata = {
  description: 'A map of South Africa from 1652 to today.',
  // NFR-03: nothing is indexed by search engines.
  robots: { follow: false, index: false },
  title: 'KinScape',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    className={`${bricolage.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    lang='en'>
    <body>{children}</body>
  </html>
);

export default RootLayout;
