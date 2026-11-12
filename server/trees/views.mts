import type { Person, PersonView } from '#ks/lib/domain/persons/types.ts';
import type { Tree } from '#ks/lib/domain/trees/types.ts';
import type { ToView } from '#ks/server/trees/types.ts';

import { isLiving } from '#ks/lib/domain/persons/living.mts';

/** The Person as its Viewer sees it, with `living` derived. In v1 the view hides nothing from an Account. */
export const personView: ToView<Person, PersonView> = (viewer, row) => ({
  ...row,
  living: isLiving(row),
});

/** The Tree as its Viewer sees it. In v1 the view hides nothing from an Account. */
export const treeView: ToView<Tree, Tree> = (viewer, row) => ({
  id: row.id,
  name: row.name,
});
