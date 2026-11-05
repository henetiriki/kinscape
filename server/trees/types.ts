import type { SessionStore } from '@ks/lib/domain/auth/types.ts';
import type { Tree, TreeStore, Viewer } from '@ks/lib/domain/trees/types.ts';

/** Maps a row to what the Viewer may see: the one place NFR-10 acts. Each group's reads pass through one. */
export type ToView<Row, View> = (viewer: Viewer, row: Row) => View;

/** What `openTree` needs; `appAdapters()` fits. `now` defaults to the clock. */
export type TreeDeps = {
  now?: () => Date;
  sessions: SessionStore;
  store: TreeStore;
};

/**
 * A Tree opened for a Viewer. Entity Specs add a group each (`persons`), built in `openTree` over
 * the store, so every read passes a `ToView`.
 */
export type TreeRepository = { tree: Tree; viewer: Viewer };
