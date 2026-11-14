import { redirect } from 'next/navigation';

import { signOutAction } from '@ks/app/sign-in/actions';
import { MapShell, polityLayer } from '@ks/features/map';
import { accountInitial } from '@ks/lib/domain/auth/initial.mts';
import { boundaryCoverage } from '@ks/lib/domain/map/coverage.mts';
import { currentSession } from '@ks/server/auth/current.mts';
import { loadAppData } from '@ks/server/boundaries/app-data';

const Home = async () => {
  const session = await currentSession();

  if (session === undefined) {
    redirect('/sign-in');
  }

  const data = loadAppData();

  return (
    <MapShell
      coverage={boundaryCoverage(data)}
      email={session.email}
      initial={accountInitial(session.email)}
      layers={[polityLayer]}
      onSignOut={signOutAction}
      sources={data.sources}
    />
  );
};

export default Home;
