"use client";
import { useEffect, useRef } from "react";
import { googleMapsLoader } from "@/utils/googleLoader";

interface MapComponentProps {
  lat: number;
  lon: number;
}

const MapComponent = ({ lat, lon }: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      if (!mapInstance.current) {
        await googleMapsLoader.load();

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat, lng: lon },
          zoom: 12,
        });

        markerInstance.current = new google.maps.Marker({
          position: { lat, lng: lon },
          map: mapInstance.current,
        });
      } else {
        mapInstance.current.setCenter({ lat, lng: lon });

        if (markerInstance.current) {
          markerInstance.current.setPosition({ lat, lng: lon });
        } else {
          markerInstance.current = new google.maps.Marker({
            position: { lat, lng: lon },
            map: mapInstance.current,
          });
        }
      }
    };

    initMap();
  }, [lat, lon]);

  return <div ref={mapRef} className="w-full h-96 rounded-lg shadow-md" />;
};

export default MapComponent;
