import type { Metadata } from 'next';

import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Public_Sans,
} from 'next/font/google';

import './tokens.css';
import './globals.css';

// Fetched at build time and served by KinScape (NFR-03).
// Each variable is the one tokens.css starts that font's stack with.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--next-font-bricolage-grotesque',
  weight: ['500', '700'],
});
const publicSans = Public_Sans({
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--next-font-public-sans',
  weight: ['400', '500', '600'],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--next-font-jetbrains-mono',
  weight: ['400', '500'],
});

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
