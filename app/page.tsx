import { MapShell } from '@ks/features/map';
import { boundaryCoverage } from '@ks/lib/domain/map/coverage';
import { loadAppData } from '@ks/server/boundaries/app-data';

const Home = () => {
  const data = loadAppData();

  return <MapShell coverage={boundaryCoverage(data)} sources={data.sources} />;
};

export default Home;
