import { loadAppData } from '@/lib/boundaries/app-data';
import { polityCollection } from '@/lib/map/features';

// Built once at deploy time: the data only changes with the repo.
export const dynamic = 'force-static';

export const GET = () => Response.json(polityCollection(loadAppData()));
