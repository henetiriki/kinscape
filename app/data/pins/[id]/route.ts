import { z } from 'zod';

import { answerOf, guarded } from '@ks/app/data/tree-route';
import { parsePinId } from '@ks/lib/domain/ids/ids.mts';
import { pinDetails } from '@ks/lib/domain/pins/pin-details.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { currentSession } from '@ks/server/auth/current.mts';

/**
 * The details of a Pin in the Viewer's Tree (PIN-02). An id that is no UUID, a missing Pin, a missing
 * Person and a Pin of another Tree all read as none.
 */
const readDetails = treeAction(z.string(), async (tree, text) => {
  const id = parsePinId(text);
  const pin = id && (await tree.pins.get(id));
  const person = pin && (await tree.persons.get(pin.personId));

  return ok(pin && person ? pinDetails(pin, person) : undefined);
});

/** A request with no session gets 401 and no body. An unknown Pin gets 404 and no body. */
export const GET = (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  guarded('Pin details route', async () =>
    (await currentSession()) === undefined
      ? new Response(null, { status: 401 })
      : answerOf(await readDetails((await params).id))
  );
