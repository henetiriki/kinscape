import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  description: 'A map of South Africa from 1652 to today.',
  // NFR-03: nothing is indexed by search engines.
  robots: { follow: false, index: false },
  title: 'KinScape',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang='en'>
    <body>{children}</body>
  </html>
);

export default RootLayout;
