'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type MarkerType = 'pickup' | 'dropoff' | 'driver';

interface MapMarker {
  lng: number;
  lat: number;
  type: MarkerType;
  label?: string;
}

interface RouteGeoJSON {
  type: 'LineString';
  coordinates: [number, number][];
}

interface TerraMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: RouteGeoJSON;
  className?: string;
  showDrivers?: boolean;
}

const MARKER_STYLES: Record<MarkerType, { color: string; size: number }> = {
  pickup: { color: '#F59E0B', size: 14 },
  dropoff: { color: '#06B6D4', size: 14 },
  driver: { color: '#06B6D4', size: 8 },
};

function createMarkerElement(type: MarkerType, label?: string): HTMLDivElement {
  const el = document.createElement('div');
  const style = MARKER_STYLES[type];

  if (type === 'driver') {
    el.style.width = `${style.size}px`;
    el.style.height = `${style.size}px`;
    el.style.borderRadius = '50%';
    el.style.backgroundColor = style.color;
    el.style.border = '2px solid rgba(6, 182, 212, 0.4)';
    el.style.boxShadow = '0 0 6px rgba(6, 182, 212, 0.3)';
  } else {
    el.style.width = `${style.size}px`;
    el.style.height = `${style.size + 6}px`;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';

    const pin = document.createElement('div');
    pin.style.width = `${style.size}px`;
    pin.style.height = `${style.size}px`;
    pin.style.borderRadius = '50% 50% 50% 0';
    pin.style.backgroundColor = style.color;
    pin.style.transform = 'rotate(-45deg)';
    pin.style.border = '2px solid white';
    pin.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    el.appendChild(pin);
  }

  if (label) {
    el.title = label;
  }

  return el;
}

const ROUTE_SOURCE_ID = 'terra-route';
const ROUTE_LAYER_ID = 'terra-route-line';

const TerraMap: React.FC<TerraMapProps> = ({
  center = [-73.935242, 40.73061],
  zoom = 12,
  markers = [],
  route,
  className = '',
  showDrivers = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[0], center[1]],
      zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center and zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [center[0], center[1]], zoom, duration: 800 });
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers();

    const filteredMarkers = showDrivers
      ? markers
      : markers.filter((m) => m.type !== 'driver');

    filteredMarkers.forEach((marker) => {
      const el = createMarkerElement(marker.type, marker.label);
      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);

      if (marker.label && marker.type !== 'driver') {
        m.setPopup(
          new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(marker.label)
        );
      }

      markersRef.current.push(m);
    });
  }, [markers, showDrivers, clearMarkers]);

  // Update route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleRoute = () => {
      // Remove existing route layer and source
      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.removeLayer(ROUTE_LAYER_ID);
      }
      if (map.getSource(ROUTE_SOURCE_ID)) {
        map.removeSource(ROUTE_SOURCE_ID);
      }

      if (!route) return;

      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        },
      });

      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#06B6D4',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });
    };

    if (map.isStyleLoaded()) {
      handleRoute();
    } else {
      map.on('style.load', handleRoute);
      return () => {
        map.off('style.load', handleRoute);
      };
    }
  }, [route]);

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-[10px] font-mono opacity-70">
        Powered by Terra
      </div>
    </div>
  );
};

TerraMap.displayName = 'TerraMap';

export { TerraMap };
export type { TerraMapProps, MapMarker, RouteGeoJSON };
