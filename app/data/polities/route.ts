import { polityCollection } from '@ks/lib/domain/map/features.mts';
import { currentSession } from '@ks/server/auth/current.mts';
import { loadAppData } from '@ks/server/boundaries/app-data';

export const GET = async () =>
  (await currentSession()) === undefined
    ? new Response(null, { status: 401 })
    : Response.json(polityCollection(loadAppData()));
