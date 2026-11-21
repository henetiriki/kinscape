import { redirect } from 'next/navigation';

import { MapWithPins } from '@ks/app/@map/MapWithPins';
import { signOutAction } from '@ks/app/sign-in/actions';
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
    <MapWithPins
      coverage={boundaryCoverage(data)}
      email={session.email}
      initial={accountInitial(session.email)}
      onSignOut={signOutAction}
      sources={data.sources}
    />
  );
};

export default Home;
