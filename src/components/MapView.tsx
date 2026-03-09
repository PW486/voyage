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
}

if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function MapContent({ stops, legs }: MapViewProps) {
  const map = useMap();

  const stopsKey = useMemo(() => stops.map(s => `${s.id}-${s.lat}-${s.lng}`).join('|'), [stops]);

  useEffect(() => {
    if (stops.length === 0) return;
    
    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 12, { animate: true });
    } else {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [80, 80], animate: true });
    }
  }, [stopsKey, map, stops]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'white', border: '2px solid #334155', borderRadius: '50%', color: '#334155', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
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

        const midpoint: [number, number] = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];

        return (
          <Fragment key={`leg-group-${idx}-${leg.fromId}-${leg.toId}`}>
            <Polyline positions={[[from.lat, from.lng], [to.lat, to.lng]]} color="#334155" weight={3} opacity={1} />
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
        zoomControl={false} 
        doubleClickZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContent {...props} />
      </MapContainer>
    </div>
  );
}
