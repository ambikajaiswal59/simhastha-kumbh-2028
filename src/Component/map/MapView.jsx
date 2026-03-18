import { useEffect,useRef } from "react";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";

import "ol/ol.css";
import "./map.css";

export default function MapView() {
  const mapRef = useRef(null);      // DOM container
  const mapInstance = useRef(null); // store map instance

  useEffect(() => {
    // Prevent multiple map instances
    if (mapInstance.current) return;

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([75.7850, 23.1805]), // default center (will be in EPSG:3857)
        zoom: 13,
      }),
    });

    return () => {
      // Cleanup on unmount
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    />
  );
}