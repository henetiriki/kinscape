import type { Metadata } from 'next';

import { AddPinPanel } from '@ks/app/screens/add-pin/AddPinPanel';
import { Stage } from '@ks/features/map';

export const metadata: Metadata = { title: 'Add a pin' };

// The map screen's frame with only its panel slot filled, and no map.
const AddPinPage = () => <Stage panel={<AddPinPanel />} />;

export default AddPinPage;
