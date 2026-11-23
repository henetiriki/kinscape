import type { Metadata } from 'next';

import { ClickPopupScreen } from '@ks/app/screens/pin-click-popup/ClickPopupScreen';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Click popup' };

const Page = async () => {
  await requireDevPage();

  return <ClickPopupScreen />;
};

export default Page;
