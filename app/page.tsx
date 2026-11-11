import { redirect } from 'next/navigation';

import { signOutAction } from '@ks/app/sign-in/actions';
import { MapShell, polityLayer } from '@ks/features/map';
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
      // An Account has no name, so the Avatar shows the first letter of the email.
      initial={session.email.charAt(0).toUpperCase()}
      layers={[polityLayer]}
      onSignOut={signOutAction}
      sources={data.sources}
    />
  );
};

export default Home;
