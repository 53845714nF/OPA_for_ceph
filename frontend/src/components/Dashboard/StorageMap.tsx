import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  Popup,
  LngLatBounds,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { StorageLocation } from "../../hooks/useDashboardStats";

interface StorageMapProps {
  locations: StorageLocation[];
}

// OpenStreetMap basemap (reliable in all networks and browsers, no API key needed)
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        "raster-saturation": -0.25,
        "raster-contrast": 0.08,
      },
    },
  ],
};

export function StorageMap({ locations }: StorageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any existing instance first
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Previous map cleanup:", e);
      }
      mapInstanceRef.current = null;
    }

    // Default center in central Germany / Europe
    const defaultCenter: [number, number] = [10.4515, 51.1657];

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: defaultCenter,
        zoom: 5.2,
        attributionControl: { compact: true },
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error("MapLibre initialization error:", err);
      setInitError(err?.message || "Karte konnte nicht initialisiert werden");
      return;
    }

    map.on("load", () => {
      try {
        map.resize();

        if (!locations || locations.length === 0) return;

        const validLocs = locations.filter((loc) => loc.lat && loc.lon);
        const bounds = new LngLatBounds();

        // Draw stylized Ceph Multisite replication link between storage nodes
        if (validLocs.length >= 2) {
          const lineCoords = validLocs.map((loc) => [loc.lon, loc.lat]);

          map.addSource("replication-link", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: lineCoords,
              },
            },
          });

          // Ambient glow line
          map.addLayer({
            id: "replication-link-glow",
            type: "line",
            source: "replication-link",
            paint: {
              "line-color": "#ffb5a0",
              "line-width": 6,
              "line-opacity": 0.45,
            },
          });

          // Crisp dashed replication sync line
          map.addLayer({
            id: "replication-link-line",
            type: "line",
            source: "replication-link",
            paint: {
              "line-color": "#6e2510",
              "line-width": 2,
              "line-dasharray": [4, 3],
              "line-opacity": 0.9,
            },
          });
        }

        // Add storage server database markers
        validLocs.forEach((loc) => {
          bounds.extend([loc.lon, loc.lat]);

          // Custom HTML marker with database server icon and pulse effect
          const el = document.createElement("div");
          el.className = "flex flex-col items-center cursor-pointer group select-none";
          el.innerHTML = `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-primary/30 opacity-75"></span>
              <div class="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-on-primary shadow-md border-2 border-white hover:scale-110 transition-transform duration-200">
                <span class="material-symbols-outlined text-[17px]">database</span>
              </div>
            </div>
            <div class="mt-1 px-2.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded-none shadow-sm text-[11px] font-hankenGrotesk font-semibold text-primary uppercase tracking-wider whitespace-nowrap group-hover:border-primary transition-colors">
              ${loc.city || loc.label}
            </div>
          `;

          const popupContent = `
            <div class="font-hankenGrotesk" style="min-width: 170px;">
              <div style="font-family: 'EB Garamond', serif; font-size: 16px; font-weight: 600; color: #6e2510; border-bottom: 1px solid #dbc1ba; padding-bottom: 4px; margin-bottom: 6px;">
                ${loc.label || loc.city}
              </div>
              <div style="font-size: 12px; color: #55433e; margin-bottom: 4px;">
                <span style="color: #88726c; font-size: 11px; text-transform: uppercase;">Zone:</span> 
                <strong style="font-family: monospace; background: #f0eded; padding: 1px 4px; border: 1px solid #dbc1ba;">${loc.zone}</strong>
              </div>
              <div style="font-size: 11px; color: #5b6144; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #5b6144;"></span>
                Ceph Multisite Sync Ready
              </div>
              <div style="font-size: 10px; color: #88726c; font-family: monospace; border-top: 1px dashed #dbc1ba; padding-top: 4px; margin-top: 6px;">
                ${loc.lat.toFixed(4)}° N, ${loc.lon.toFixed(4)}° E
              </div>
            </div>
          `;

          const popup = new Popup({
            offset: 24,
            closeButton: true,
            closeOnClick: false,
            className: "archival-map-popup",
          }).setHTML(popupContent);

          new Marker({ element: el })
            .setLngLat([loc.lon, loc.lat])
            .setPopup(popup)
            .addTo(map);
        });

        if (validLocs.length > 1) {
          map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 90, right: 90 },
            maxZoom: 6.8,
            duration: 900,
          });
        } else if (validLocs.length === 1) {
          map.setCenter([validLocs[0].lon, validLocs[0].lat]);
          map.setZoom(6);
        }
      } catch (err) {
        console.error("Error setting up map layers/markers:", err);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Cleanup error:", e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  return (
    <div className="bg-surface-container-low border border-outline-variant p-6 ambient-shadow">
      {/* Scoped CSS for archival styling of MapLibre components */}
      <style>{`
        .archival-map-popup .maplibregl-popup-content {
          background-color: #fcf9f8 !important;
          border: 1px solid #dbc1ba !important;
          border-radius: 0px !important;
          box-shadow: 0 4px 20px rgba(110, 37, 16, 0.08) !important;
          padding: 12px 14px !important;
        }
        .archival-map-popup .maplibregl-popup-tip {
          border-top-color: #fcf9f8 !important;
          border-bottom-color: #fcf9f8 !important;
        }
        .archival-map-container .maplibregl-ctrl-group {
          background-color: #fcf9f8 !important;
          border: 1px solid #dbc1ba !important;
          border-radius: 0px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
          overflow: hidden;
        }
        .archival-map-container .maplibregl-ctrl-group button {
          border-bottom: 1px solid #dbc1ba !important;
          color: #6e2510 !important;
        }
        .archival-map-container .maplibregl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .archival-map-container .maplibregl-ctrl-group button:hover {
          background-color: #f0eded !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-2xl">map</span>
          <h3 className="font-ebGaramond text-headline-md text-on-surface">Storage Locations</h3>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-variant border border-outline-variant text-on-surface-variant font-hankenGrotesk text-data-mono uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
            Zones: {locations.length}
          </span>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[420px] border border-outline-variant bg-[#f6f3f2] overflow-hidden archival-map-container">
        {initError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">map</span>
            <p className="font-medium text-sm">{initError}</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}
      </div>

      {/* Zone Location Cards underneath */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.zone}
            className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant hover:border-primary/60 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-9 w-9 flex items-center justify-center bg-surface-container border border-outline-variant rounded-none text-primary">
                <span className="material-symbols-outlined text-lg">database</span>
              </div>
              <div>
                <span className="font-ebGaramond text-body-lg text-on-surface font-semibold block leading-tight">
                  {loc.city || loc.label}
                </span>
                <span className="text-xs text-on-surface-variant font-mono mt-0.5 block">
                  Identifier: <span className="text-primary font-bold">{loc.zone}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant font-mono block">
                {loc.lat ? `${loc.lat.toFixed(2)}°N, ${loc.lon.toFixed(2)}°E` : "Standort aktiv"}
              </span>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-secondary font-hankenGrotesk uppercase tracking-wider font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                Synchronized
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
