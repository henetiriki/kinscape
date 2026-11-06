import { redirect } from 'next/navigation';

import { MapShell, polityLayer } from '@ks/features/map';
import { boundaryCoverage } from '@ks/lib/domain/map/coverage.mts';
import { currentSession } from '@ks/server/auth/current.mts';
import { loadAppData } from '@ks/server/boundaries/app-data';

const Home = async () => {
  if ((await currentSession()) === undefined) {
    redirect('/sign-in');
  }

  const data = loadAppData();

  return (
    <MapShell
      coverage={boundaryCoverage(data)}
      layers={[polityLayer]}
      sources={data.sources}
    />
  );
};

export default Home;
