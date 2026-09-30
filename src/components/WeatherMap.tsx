'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layers, Mountain, Compass, Map as MapIcon, Eye } from 'lucide-react';

interface WeatherMapProps {
  lat: number;
  lon: number;
  panchayatName: string;
  blockName: string;
  elevationM: number;
  slopeDeg: number;
  aspectDeg: number;
  geoJsonPolygon?: any;
  currentTemp?: number | null;
  currentRain?: number | null;
}

export default function WeatherMap({
  lat,
  lon,
  panchayatName,
  blockName,
  elevationM,
  slopeDeg,
  aspectDeg,
  geoJsonPolygon,
  currentTemp,
  currentRain
}: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const activeTileLayerRef = useRef<any>(null);
  const [activeLayerType, setActiveLayerType] = useState<'topo' | 'satellite' | 'street'>('topo');

  // Tile layer configurations that do NOT require any API keys
  const TILE_LAYERS = {
    topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Topographic Geography',
      maxZoom: 18
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World High-Res Satellite Imagery',
      maxZoom: 18
    },
    street: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap Geography',
      maxZoom: 19
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered at Panchayat coordinates
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Add default basemap (Topographic Geography)
      const config = TILE_LAYERS[activeLayerType];
      const baseTile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution
      }).addTo(map);
      activeTileLayerRef.current = baseTile;
      mapInstanceRef.current = map;

      // Render authoritative Panchayat boundary polygon
      if (geoJsonPolygon) {
        polygonLayerRef.current = L.geoJSON(geoJsonPolygon, {
          style: {
            color: '#10b981',
            weight: 3.5,
            opacity: 0.95,
            fillColor: '#06b6d4',
            fillOpacity: 0.22,
            dashArray: '5, 5'
          }
        }).addTo(map);

        try {
          map.fitBounds(polygonLayerRef.current.getBounds(), { padding: [35, 35] });
        } catch (e) {
          map.setView([lat, lon], 13);
        }
      }

      // Custom high-visibility centroid marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #10b981, #06b6d4);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: -0.5px;
          ">
            GP
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
      markerRef.current.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.5; min-width: 170px;">
          <strong style="color: #10b981; font-size: 14px;">${panchayatName}</strong><br/>
          <span style="color: #cbd5e1;">Block: ${blockName}</span><br/>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15);">
            <strong>Elevation:</strong> ${elevationM} m<br/>
            <strong>Slope:</strong> ${slopeDeg}° | <strong>Aspect:</strong> ${aspectDeg}°<br/>
            ${currentTemp !== null && currentTemp !== undefined ? `<strong>Live Temp:</strong> <span style="color: #38bdf8;">${currentTemp}°C</span>` : ''}
          </div>
        </div>
      `).openPopup();
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, panchayatName, blockName, elevationM, slopeDeg, aspectDeg, geoJsonPolygon]);

  // Switch tile basemap dynamically without re-initializing entire map
  const switchBasemap = async (type: 'topo' | 'satellite' | 'street') => {
    setActiveLayerType(type);
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;

    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }

    const config = TILE_LAYERS[type];
    const newTile = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution
    }).addTo(mapInstanceRef.current);
    activeTileLayerRef.current = newTile;

    // Bring polygon and marker to front
    if (polygonLayerRef.current) polygonLayerRef.current.bringToFront();
    if (markerRef.current) markerRef.current.bringToFront();
  };

  return (
    <div className="glass-panel" style={{ position: 'relative', height: '500px', overflow: 'hidden' }}>
      {/* Topographic Info Overlay (Top Left) */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 500,
        background: 'rgba(7, 13, 24, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-emerald">Indian GIS Geography</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LGD-2024-V2</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
          {panchayatName}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Block: {blockName} | Coordinates: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </div>
      </div>

      {/* Basemap Switcher Toolbar (Top Right) */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 500,
        background: 'rgba(7, 13, 24, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '4px',
        display: 'flex',
        gap: '4px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={() => switchBasemap('topo')}
          title="Physical Topographic Terrain (Contours & Relief)"
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: activeLayerType === 'topo' ? '#34d399' : 'var(--text-muted)',
            background: activeLayerType === 'topo' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeLayerType === 'topo' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent'
          }}
        >
          <Mountain size={14} /> Topographic
        </button>

        <button
          onClick={() => switchBasemap('satellite')}
          title="High-Resolution Satellite Aerial View"
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: activeLayerType === 'satellite' ? '#38bdf8' : 'var(--text-muted)',
            background: activeLayerType === 'satellite' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            border: activeLayerType === 'satellite' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent'
          }}
        >
          <Eye size={14} /> Satellite
        </button>

        <button
          onClick={() => switchBasemap('street')}
          title="Standard Cartographic Roads & Towns"
          style={{
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: activeLayerType === 'street' ? '#fbbf24' : 'var(--text-muted)',
            background: activeLayerType === 'street' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: activeLayerType === 'street' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent'
          }}
        >
          <MapIcon size={14} /> Streets
        </button>
      </div>

      {/* Topographic Attributes Legend (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 500,
        background: 'rgba(7, 13, 24, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px',
        fontSize: '0.78rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Mountain size={16} />
          <span>Elevation: <strong>{elevationM}m</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
          <Compass size={16} />
          <span>Slope: <strong>{slopeDeg}°</strong> (Aspect {aspectDeg}°)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(6, 182, 212, 0.3)', border: '2px dashed #10b981', display: 'inline-block' }}></span>
          <span>Panchayat Boundary (LGD)</span>
        </div>
      </div>

      {/* Map DOM Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
