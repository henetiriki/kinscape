import type { Metadata } from 'next';

import { AccountMenuScreen } from '@ks/app/screens/map-account-menu/AccountMenuScreen';
import { map } from '@ks/design/tokens.generated.ts';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Account menu' };

const Page = async () => {
  await requireDevPage();

  // The sea colour shows in place of the map, on its own layer as the map
  // canvas is. Text above a separate layer gets grey edges, as on the board;
  // text on the page layer gets coloured edges.
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div
        aria-hidden
        style={{
          background: map.sea,
          inset: 0,
          position: 'absolute',
          willChange: 'transform',
        }}
      />
      <AccountMenuScreen />
    </div>
  );
};

export default Page;
