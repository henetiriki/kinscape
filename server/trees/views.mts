import type { Person, PersonView } from '#ks/lib/domain/persons/types.ts';
import type { Pin } from '#ks/lib/domain/pins/types.ts';
import type { Place } from '#ks/lib/domain/places/types.ts';
import type { Relationship } from '#ks/lib/domain/relationships/types.ts';
import type { Tree } from '#ks/lib/domain/trees/types.ts';
import type { ToView } from '#ks/server/trees/types.ts';

import { isLiving } from '#ks/lib/domain/persons/living.mts';

/** The Person as its Viewer sees it, with `living` derived. In v1 the view hides nothing from an Account. */
export const personView: ToView<Person, PersonView> = (viewer, row) => ({
  ...row,
  living: isLiving(row),
});

/** The Place as its Viewer sees it. In v1 the view hides nothing from an Account. */
export const placeView: ToView<Place, Place> = (viewer, row) => row;

/**
 * The Pin as its Viewer sees it. In v1 the view hides nothing from an Account. The address is the
 * field to hide here for a living Person (POPIA).
 */
export const pinView: ToView<Pin, Pin> = (viewer, row) => row;

/** The Relationship as its Viewer sees it. In v1 the view hides nothing from an Account. */
export const relationshipView: ToView<Relationship, Relationship> = (
  viewer,
  row
) => row;

/** The Tree as its Viewer sees it. In v1 the view hides nothing from an Account. */
export const treeView: ToView<Tree, Tree> = (viewer, row) => ({
  id: row.id,
  name: row.name,
});
