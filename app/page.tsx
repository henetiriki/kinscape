import { MapShell } from '@ks/app/components/map/MapShell';
import { loadAppData } from '@ks/lib/boundaries/app-data';
import { boundaryCoverage } from '@ks/lib/map/coverage';

const Home = () => {
  const data = loadAppData();

  return <MapShell coverage={boundaryCoverage(data)} sources={data.sources} />;
};

export default Home;
