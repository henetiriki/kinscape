import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { privateJson } from '@ks/app/data/private-json';
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

/**
 * A request with no session, or a session with no Tree, gets 401 and no body. An unknown Pin gets
 * 404 and no body. A throw leaves a log of the error name only: its message can hold Person data.
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    if ((await currentSession()) === undefined) {
      return new Response(null, { status: 401 });
    }

    const { id } = await params;
    const details = await readDetails(id);

    if (!details.ok) {
      return new Response(null, { status: 401 });
    }

    return details.value === undefined
      ? new Response(null, { status: 404 })
      : privateJson(details.value);
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      'Pin details route failed:',
      error instanceof Error ? error.name : 'unknown'
    );

    return new Response(null, { status: 500 });
  }
};
