'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/* ── Types ────────────────────────────────────────────────────────────────── */

type MarkerType = 'pickup' | 'dropoff' | 'driver';

interface MapMarker {
  lng: number;
  lat: number;
  type: MarkerType;
  label?: string;
  /** Extra detail shown in popup on click */
  detail?: string;
}

interface RouteGeoJSON {
  type: 'LineString';
  coordinates: [number, number][];
}

interface RouteLayer {
  id: string;
  geometry: RouteGeoJSON;
  /** Route color derived from job status */
  status?: 'EN_ROUTE_PICKUP' | 'PICKED_UP' | 'EN_ROUTE_DROPOFF' | 'MATCHED' | 'DELIVERED';
  /** Distance in km (from Terra) */
  distanceKm?: number;
  /** Duration in minutes (from Terra) */
  durationMin?: number;
}

interface TerraMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  /** Single route (backward compat) */
  route?: RouteGeoJSON;
  /** Multiple routes with status coloring */
  routes?: RouteLayer[];
  className?: string;
  showDrivers?: boolean;
  /** Auto-fit map bounds to contain all markers and routes */
  fitBounds?: boolean;
  /** Show route distance/duration overlay */
  showRouteInfo?: boolean;
}

/* ── Route status → color mapping ─────────────────────────────────────────── */

const ROUTE_STATUS_COLORS: Record<string, string> = {
  EN_ROUTE_PICKUP: '#F59E0B',    // amber — heading to pickup
  PICKED_UP: '#8B5CF6',          // violet — has package, loading
  EN_ROUTE_DROPOFF: '#06B6D4',   // cyan — delivering
  MATCHED: '#6B7280',            // gray — matched but not moving yet
  DELIVERED: '#10B981',          // green — completed
};

const DEFAULT_ROUTE_COLOR = '#06B6D4';

/* ── Marker rendering ─────────────────────────────────────────────────────── */

const MARKER_STYLES: Record<MarkerType, { color: string; size: number }> = {
  pickup: { color: '#F59E0B', size: 14 },
  dropoff: { color: '#06B6D4', size: 14 },
  driver: { color: '#06B6D4', size: 10 },
};

function createMarkerElement(type: MarkerType, label?: string): HTMLDivElement {
  const el = document.createElement('div');
  const style = MARKER_STYLES[type];

  if (type === 'driver') {
    // Pulsing driver dot
    el.style.width = `${style.size}px`;
    el.style.height = `${style.size}px`;
    el.style.borderRadius = '50%';
    el.style.backgroundColor = style.color;
    el.style.border = '2px solid rgba(6, 182, 212, 0.4)';
    el.style.boxShadow = '0 0 6px rgba(6, 182, 212, 0.3)';
    el.style.position = 'relative';
    el.style.cursor = 'pointer';

    // Pulse ring
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.top = '-4px';
    pulse.style.left = '-4px';
    pulse.style.width = `${style.size + 8}px`;
    pulse.style.height = `${style.size + 8}px`;
    pulse.style.borderRadius = '50%';
    pulse.style.border = '2px solid rgba(6, 182, 212, 0.5)';
    pulse.style.animation = 'terra-pulse 2s ease-out infinite';
    el.appendChild(pulse);
  } else {
    el.style.width = `${style.size}px`;
    el.style.height = `${style.size + 6}px`;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.cursor = 'pointer';

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

/* ── Pulse animation (injected once) ──────────────────────────────────────── */

let pulseStyleInjected = false;
function injectPulseAnimation() {
  if (pulseStyleInjected) return;
  pulseStyleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes terra-pulse {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Component ────────────────────────────────────────────────────────────── */

const ROUTE_SOURCE_PREFIX = 'terra-route-';
const ROUTE_LAYER_PREFIX = 'terra-route-line-';

const TerraMap: React.FC<TerraMapProps> = ({
  center = [-73.935242, 40.73061],
  zoom = 12,
  markers = [],
  route,
  routes,
  className = '',
  showDrivers = true,
  fitBounds = true,
  showRouteInfo = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeIdsRef = useRef<string[]>([]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  const clearRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    routeIdsRef.current.forEach((id) => {
      const layerId = ROUTE_LAYER_PREFIX + id;
      const sourceId = ROUTE_SOURCE_PREFIX + id;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    routeIdsRef.current = [];
  }, []);

  // Mount
  useEffect(() => {
    if (!containerRef.current) return;

    injectPulseAnimation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/zoom (only when fitBounds is off)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitBounds) return;
    map.flyTo({ center: [center[0], center[1]], zoom, duration: 800 });
  }, [center, zoom, fitBounds]);

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

      const popupContent = marker.detail
        ? `<div style="font-family: var(--font-inter, system-ui); font-size: 12px; line-height: 1.4; max-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: #0A0A0F;">${marker.label || ''}</div>
            <div style="color: #6B7280;">${marker.detail}</div>
          </div>`
        : marker.label || '';

      const popup = new mapboxgl.Popup({
        offset: marker.type === 'driver' ? 8 : 16,
        closeButton: false,
        maxWidth: '240px',
      });

      if (marker.detail) {
        popup.setHTML(popupContent);
      } else {
        popup.setText(popupContent);
      }

      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(m);
    });
  }, [markers, showDrivers, clearMarkers]);

  // Update routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyRoutes = () => {
      clearRoutes();

      // Build normalized route list from either `routes` or legacy `route` prop
      const allRoutes: RouteLayer[] = [];

      if (routes && routes.length > 0) {
        allRoutes.push(...routes);
      } else if (route) {
        allRoutes.push({ id: 'default', geometry: route });
      }

      allRoutes.forEach((r) => {
        const sourceId = ROUTE_SOURCE_PREFIX + r.id;
        const layerId = ROUTE_LAYER_PREFIX + r.id;
        const color = r.status ? (ROUTE_STATUS_COLORS[r.status] || DEFAULT_ROUTE_COLOR) : DEFAULT_ROUTE_COLOR;

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: r.geometry.coordinates,
            },
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': r.status === 'DELIVERED' ? 2 : 4,
            'line-opacity': r.status === 'MATCHED' ? 0.5 : 0.85,
          },
        });

        routeIdsRef.current.push(r.id);
      });

      // Auto-fit bounds
      if (fitBounds) {
        const bounds = new mapboxgl.LngLatBounds();
        let hasPoints = false;

        // Include all marker positions
        const filteredMarkers = showDrivers
          ? markers
          : markers.filter((m) => m.type !== 'driver');

        filteredMarkers.forEach((m) => {
          bounds.extend([m.lng, m.lat]);
          hasPoints = true;
        });

        // Include all route coordinates
        allRoutes.forEach((r) => {
          r.geometry.coordinates.forEach(([lng, lat]) => {
            bounds.extend([lng, lat]);
            hasPoints = true;
          });
        });

        if (hasPoints) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 800 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyRoutes();
    } else {
      map.on('style.load', applyRoutes);
      return () => {
        map.off('style.load', applyRoutes);
      };
    }
  }, [route, routes, markers, showDrivers, fitBounds, clearRoutes]);

  // Build route info for overlay
  const routeInfoList = (routes || []).filter((r) => r.distanceKm != null && r.durationMin != null);
  const singleRouteInfo = route && !routes?.length
    ? null // single route doesn't have metadata in the legacy prop
    : null;

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[300px]" />

      {/* Route metadata overlay */}
      {showRouteInfo && routeInfoList.length > 0 && (
        <div className="absolute top-2 left-2 space-y-1">
          {routeInfoList.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1 bg-black/70 rounded text-[10px] font-mono text-white"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{
                  backgroundColor: r.status ? (ROUTE_STATUS_COLORS[r.status] || DEFAULT_ROUTE_COLOR) : DEFAULT_ROUTE_COLOR,
                }}
              />
              <span>{r.distanceKm?.toFixed(1)} km</span>
              <span className="opacity-50">|</span>
              <span>{r.durationMin} min</span>
            </div>
          ))}
        </div>
      )}

      {/* Route status legend (when multiple routes shown) */}
      {routes && routes.length > 1 && (
        <div className="absolute bottom-8 left-2 flex items-center gap-3 px-2 py-1 bg-black/60 rounded text-[9px] font-mono text-white/80">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ROUTE_STATUS_COLORS.EN_ROUTE_PICKUP }} />
            To Pickup
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ROUTE_STATUS_COLORS.EN_ROUTE_DROPOFF }} />
            Delivering
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ROUTE_STATUS_COLORS.MATCHED }} />
            Matched
          </span>
        </div>
      )}

      {/* Terra branding */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-[10px] font-mono opacity-70">
        Powered by Terra
      </div>
    </div>
  );
};

TerraMap.displayName = 'TerraMap';

export { TerraMap };
export type { TerraMapProps, MapMarker, RouteGeoJSON, RouteLayer };
