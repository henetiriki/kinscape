import type { Metadata } from 'next';

import { AccountMenuScreen } from '@ks/app/screens/map-account-menu/AccountMenuScreen';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { requireDevPage } from '@ks/server/auth/current.mts';

export const metadata: Metadata = { title: 'Account menu' };

const { map } = resolveTokens(rawTokens);

const Page = async () => {
  await requireDevPage();

  // The sea colour stands in for the map, as the board draws it.
  return (
    <div style={{ background: map.sea, height: '100%' }}>
      <AccountMenuScreen />
    </div>
  );
};

export default Page;
