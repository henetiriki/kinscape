import type { Tree } from '../../lib/domain/trees/types.ts';

/** A Tree the Viewer may access. Entity Specs add their reads and writes here. */
export type TreeRepository = { tree: Tree };
