"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// MapLibre looks for its worker next to its own module, which the bundle moves.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

// Roughly the middle of South Africa.
const CENTRE: [number, number] = [25, -29];
const ZOOM = 4.5;

export default function MapView() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // A background layer only: no basemap, tiles or borders until M1.
    const map = new MapLibreMap({
      container: container.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "background", type: "background", paint: { "background-color": "#f2efe9" } }],
      },
      center: CENTRE,
      zoom: ZOOM,
    });
    map.addControl(new NavigationControl());
    map.addControl(new ScaleControl());

    return () => map.remove();
  }, []);

  return <div ref={container} className="map" />;
}
