import { z } from 'zod';

import { answerOf, guarded } from '@ks/app/data/tree-route';
import { parsePinId } from '@ks/lib/domain/ids/ids.mts';
import { pinEditFields } from '@ks/lib/domain/pins/pin-edit.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { currentSession } from '@ks/server/auth/current.mts';

/**
 * The fields of a Pin for the edit form (PIN-02). An id that is no UUID, a missing Pin, a missing
 * Place and a Pin of another Tree all read as none.
 */
const readFields = treeAction(z.string(), async (tree, text) => {
  const id = parsePinId(text);
  const pin = id && (await tree.pins.get(id));
  const place = pin && (await tree.places.get(pin.placeId));

  return ok(pin && place ? pinEditFields(pin, place) : undefined);
});

/** A request with no session gets 401 and no body. An unknown Pin gets 404 and no body. */
export const GET = (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  guarded('Pin edit route', async () =>
    (await currentSession()) === undefined
      ? new Response(null, { status: 401 })
      : answerOf(await readFields((await params).id))
  );
