import type { Metadata } from 'next';

import { PinPopupPage } from '@ks/app/screens/map-pin-popup/PinPopupPage';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Pin popup, failed' };

const Page = async () => {
  await requireDevPage();

  return <PinPopupPage state='failed' />;
};

export default Page;
