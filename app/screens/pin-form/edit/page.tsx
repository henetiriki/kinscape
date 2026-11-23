import type { Metadata } from 'next';

import { PinFormScreen } from '@ks/app/screens/pin-form/PinFormScreen';
import { parsePinId } from '@ks/lib/domain/ids/ids.mts';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Edit a pin' };

// A synthetic Pin id. Each design state routes `/data/pins/{id}/edit`, so the page reads no Pin of the Tree.
const PIN_ID = parsePinId('01900000-0000-7000-b000-0000000000d1')!;

const Page = async () => {
  await requireDevPage();

  return <PinFormScreen pinId={PIN_ID} />;
};

export default Page;
