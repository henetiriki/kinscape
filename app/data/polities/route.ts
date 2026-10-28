import { polityCollection } from '@ks/lib/domain/map/features';
import { loadAppData } from '@ks/server/boundaries/app-data';

// Built once at deploy time: the data only changes with the repo.
export const dynamic = 'force-static';

export const GET = () => Response.json(polityCollection(loadAppData()));
