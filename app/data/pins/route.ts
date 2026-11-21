import { z } from 'zod';

import { answerOf, guarded } from '@ks/app/data/tree-route';
import { mapPins } from '@ks/lib/domain/pins/map-pins.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { currentSession } from '@ks/server/auth/current.mts';

/** The Pins of the Viewer's Tree, each with the position of its Place (PIN-02). */
const mapPinsOfTree = treeAction(z.undefined(), async tree => {
  const [pins, places] = await Promise.all([
    tree.pins.list(),
    tree.places.list(),
  ]);

  return ok(mapPins(pins, places));
});

/** A request with no session gets 401 and no body. The Tree comes from the cookie, never from the request. */
export const GET = () =>
  guarded('Pins route', async () =>
    (await currentSession()) === undefined
      ? new Response(null, { status: 401 })
      : answerOf(await mapPinsOfTree(undefined))
  );
