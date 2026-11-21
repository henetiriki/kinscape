import type { Metadata } from 'next';

import { MapPinCountScreen } from '@ks/app/screens/map-pin-count/MapPinCountScreen';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Pins, count marker' };

const Page = async () => {
  await requireDevPage();

  return <MapPinCountScreen />;
};

export default Page;
