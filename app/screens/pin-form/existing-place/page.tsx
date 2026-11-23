import type { Metadata } from 'next';

import { PinFormScreen } from '@ks/app/screens/pin-form/PinFormScreen';
import { parsePlaceId } from '@ks/lib/domain/ids/ids.mts';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Add a pin at a Place' };

// A synthetic Place. The panel at it needs no Pin of the Tree.
const PLACE = {
  id: parsePlaceId('01900000-0000-7000-a000-0000000000c1')!,
  latitude: -29.12,
  longitude: 26.21,
  precision: 'farm',
} as const;

const Page = async () => {
  await requireDevPage();

  return <PinFormScreen place={PLACE} />;
};

export default Page;
