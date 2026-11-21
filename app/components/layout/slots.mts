/** The slots of `MapLayout` in DOM order. `search`, `action` and `account` stack above the others (`MapLayout.module.css`). A phone shows `layers` and hides `action`, `account`, `zoom` and `credits`. */
export const SLOTS = [
  'search',
  'action',
  'account',
  'zoom',
  'layers',
  'panel',
  'dock',
  'credits',
  'overlay',
] as const;
