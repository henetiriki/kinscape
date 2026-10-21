import { MapShell } from '@/app/components/MapShell';
import { loadAppData } from '@/lib/boundaries/app-data';

const Home = () => <MapShell sources={loadAppData().sources} />;

export default Home;
