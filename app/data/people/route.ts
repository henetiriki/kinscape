import { z } from 'zod';

import { answerOf, guarded } from '@ks/app/data/tree-route';
import { personSummary } from '@ks/lib/domain/persons/dates.mts';
import { ok } from '@ks/lib/domain/result/result.mts';
import { treeAction } from '@ks/server/action.mts';
import { currentSession } from '@ks/server/auth/current.mts';

/** The Persons of the Viewer's Tree as summaries (PIN-01). The notes stay on the server. */
const peopleOfTree = treeAction(z.undefined(), async tree =>
  ok((await tree.persons.list()).map(personSummary))
);

/** A request with no session gets 401 and no body. The Tree comes from the cookie, never from the request. */
export const GET = () =>
  guarded('People route', async () =>
    (await currentSession()) === undefined
      ? new Response(null, { status: 401 })
      : answerOf(await peopleOfTree(undefined))
  );
