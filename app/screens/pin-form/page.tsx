import type { Metadata } from 'next';

import { PinFormScreen } from '@ks/app/screens/pin-form/PinFormScreen';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Add a pin' };

const Page = async () => {
  await requireDevPage();

  return <PinFormScreen />;
};

export default Page;
