export type Shot = {
  fullPage: boolean;
  height: number;
  scale: number;
  width: number;
};

/** The phone boards are long pages; every other phone file is one screen. */
const PHONE_BOARD = /^(?:style-\d.*|map-style|design-kit)-phone$/;

/** Phone screens, style guide boards and the map style board each have their own size. */
export const shotFor = (name: string): Shot => {
  if (name.includes('phone')) {
    return {
      fullPage: PHONE_BOARD.test(name),
      height: 844,
      scale: 2,
      width: 390,
    };
  }

  if (name.startsWith('style-') || name === 'map-style') {
    return { fullPage: true, height: 900, scale: 1, width: 1440 };
  }

  return { fullPage: false, height: 900, scale: 1, width: 1440 };
};
