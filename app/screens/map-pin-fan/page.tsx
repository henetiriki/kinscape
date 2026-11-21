import type { Metadata } from 'next';

import { MapPinFanScreen } from '@ks/app/screens/map-pin-fan/MapPinFanScreen';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Pins, fan-out' };

const Page = async () => {
  await requireDevPage();

  return <MapPinFanScreen />;
};

export default Page;
