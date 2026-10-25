import { MapShell } from '@/app/components/map/MapShell';
import { loadAppData } from '@/lib/boundaries/app-data';
import { boundaryCoverage } from '@/lib/map/coverage';

const Home = () => {
  const data = loadAppData();

  return <MapShell coverage={boundaryCoverage(data)} sources={data.sources} />;
};

export default Home;
