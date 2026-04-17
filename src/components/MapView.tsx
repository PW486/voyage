'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, Leg, TransportMode } from '@/types';
import L from 'leaflet';
import { useEffect, useMemo, Fragment } from 'react';
import { Plus, Minus, Plane, Train, Bus, Ship, Car, Bike, Footprints } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapViewProps {
  stops: Stop[];
  legs: Leg[];
  level?: number;
}

if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function MapContent({ stops, legs, level = 1 }: MapViewProps) {
  const map = useMap();

  const getSegmentMidpoint = (from: Stop, to: Stop): [number, number] => {
    // Average in projected map space so the marker stays centered on the visible line.
    const crs = map.options.crs ?? L.CRS.EPSG3857;
    const fromPoint = crs.project(L.latLng(from.lat, from.lng));
    const toPoint = crs.project(L.latLng(to.lat, to.lng));
    const midpoint = L.point(
      (fromPoint.x + toPoint.x) / 2,
      (fromPoint.y + toPoint.y) / 2
    );
    const midpointLatLng = crs.unproject(midpoint);

    return [midpointLatLng.lat, midpointLatLng.lng];
  };

  const getBottomPadding = (lvl: number) => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return 50;
    switch (lvl) {
      case 1: return 180; // 137px + margin
      case 2: return window.innerHeight * 0.7 + 20; // 70svh + margin
      default: return 180;
    }
  };

  const stopsKey = useMemo(() => stops.map(s => `${s.id}-${s.lat}-${s.lng}`).join('|'), [stops]);

  useEffect(() => {
    if (stops.length === 0) return;
    
    const bottomPadding = getBottomPadding(level);
    const sidePadding = 40;
    const topPadding = 60;

    if (stops.length === 1) {
      const targetPoint = L.latLng(stops[0].lat, stops[0].lng);
      map.setView(targetPoint, 12, { animate: true });
      
      if (window.innerWidth <= 768) {
        const point = map.project(targetPoint, 12);
        const newPoint = L.point(point.x, point.y + (bottomPadding / 2.5));
        const newLatLng = map.unproject(newPoint, 12);
        map.panTo(newLatLng, { animate: true });
      }
    } else {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { 
        paddingTopLeft: [sidePadding, topPadding], 
        paddingBottomRight: [sidePadding, bottomPadding],
        animate: true 
      });
    }
  }, [stopsKey, map, stops, level]);

  const getTransportIconMarkup = (mode: TransportMode) => {
    const icons = {
      PLANE: <Plane size={14} />,
      TRAIN: <Train size={14} />,
      BUS: <Bus size={14} />,
      FERRY: <Ship size={14} />,
      CAR: <Car size={14} />,
      BIKE: <Bike size={14} />,
      WALK: <Footprints size={14} />,
    };
    return renderToStaticMarkup(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'white', border: '2px solid #334155', borderRadius: '50%', color: '#334155', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', pointerEvents: 'none', cursor: 'default' }}>
        {icons[mode]}
      </div>
    );
  };

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        crossOrigin="anonymous"
      />
      
      {stops.map((stop, index) => (
        <Marker 
          key={`marker-${stop.id}-${index}`}
          position={[stop.lat, stop.lng]} 
          interactive={false}
          icon={L.divIcon({
            className: 'custom-marker-container',
            html: `<div class="marker-wrapper"><div class="marker-label">${stop.name}</div><div class="marker-number">${index + 1}</div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        />
      ))}
      {legs.map((leg, idx) => {
        const from = stops.find(s => s.id === leg.fromId);
        const to = stops.find(s => s.id === leg.toId);
        if (!from || !to) return null;

        const midpoint = getSegmentMidpoint(from, to);

        return (
          <Fragment key={`leg-group-${idx}-${leg.fromId}-${leg.toId}`}>
            <Polyline positions={[[from.lat, from.lng], [to.lat, to.lng]]} color="#334155" weight={3} opacity={1} interactive={false} />
            {!leg.isReturn && (
              <Marker 
                position={midpoint} 
                interactive={false}
                icon={L.divIcon({
                  className: 'transport-marker-icon',
                  html: getTransportIconMarkup(leg.mode),
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              />
            )}
          </Fragment>
        );
      })}

      <div className="custom-zoom-control">
        <button 
          className="zoom-button" 
          onClick={(e) => {
            e.stopPropagation();
            map.zoomIn();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <Plus size={20} />
        </button>
        <button 
          className="zoom-button" 
          onClick={(e) => {
            e.stopPropagation();
            map.zoomOut();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <Minus size={20} />
        </button>
      </div>
    </>
  );
}

export default function MapView(props: MapViewProps) {
  return (
    <div className="map-container">
      <MapContainer 
        center={[40.7128, -74.0060]} 
        zoom={11} 
        scrollWheelZoom={true} 
        touchZoom={true}
        zoomControl={false} 
        doubleClickZoom={false}
        zoomSnap={1}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContent {...props} />
      </MapContainer>
    </div>
  );
}
