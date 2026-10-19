import { MapShell } from '@/components/MapShell';
import { loadAppData } from '@/lib/boundaries/app-data';

const Home = () => <MapShell sources={loadAppData().sources} />;

export default Home;
