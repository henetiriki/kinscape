// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts). This
// type holds each method that a spec calls on it.
export type TestWindow = {
  kinscapeMap: {
    getCenter: () => { lat: number; lng: number };
    getMaxZoom: () => number;
    getMinZoom: () => number;
    getPadding: () => {
      bottom: number;
      left: number;
      right: number;
      top: number;
    };
    getZoom: () => number;
    hasImage: (id: string) => boolean;
    jumpTo: (options: { zoom: number }) => void;
    project: (point: [number, number] | { lat: number; lng: number }) => {
      x: number;
      y: number;
    };
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => { properties: Record<string, string> }[];
    querySourceFeatures: (source: string) => unknown[];
  };
};
