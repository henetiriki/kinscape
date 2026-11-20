import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { privateJson } from '@ks/app/data/private-json';
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

/**
 * A request with no session, or a session with no Tree, gets 401 and no body. The Tree comes from
 * the cookie, never from the request. A throw leaves a log of the error name only: its message can
 * hold Person data.
 */
export const GET = async () => {
  try {
    if ((await currentSession()) === undefined) {
      return new Response(null, { status: 401 });
    }

    const pins = await mapPinsOfTree(undefined);

    return pins.ok
      ? privateJson(pins.value)
      : new Response(null, { status: 401 });
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      'Pins route failed:',
      error instanceof Error ? error.name : 'unknown'
    );

    return new Response(null, { status: 500 });
  }
};
