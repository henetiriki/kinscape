import type { Metadata } from 'next';

import { MapLayout } from '@ks/app/components/layout/MapLayout';
import { AddPinPanel } from '@ks/app/screens/add-pin/AddPinPanel';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Add a pin' };

// The map screen's frame with only its panel slot filled, and no map.
const AddPinPage = () => <MapLayout panel={<AddPinPanel />} />;

const Page = async () => {
  await requireDevPage();

  return <AddPinPage />;
};

export default Page;
