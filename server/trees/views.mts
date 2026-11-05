import type { Tree } from '#ks/lib/domain/trees/types.ts';
import type { ToView } from '#ks/server/trees/types.ts';

/** The Tree as its Viewer sees it. Nothing is hidden from an Account in v1. */
export const treeView: ToView<Tree, Tree> = (viewer, row) => ({
  id: row.id,
  name: row.name,
});
