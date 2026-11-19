/** The slots of `MapLayout` in DOM order. `search` and `account` stack above the others (`MapLayout.module.css`). A phone shows `layers` and hides `account`, `zoom` and `credits`. */
export const SLOTS = [
  'search',
  'account',
  'zoom',
  'layers',
  'panel',
  'dock',
  'credits',
  'overlay',
] as const;
