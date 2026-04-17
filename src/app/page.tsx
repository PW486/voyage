'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { Stop, Leg, TransportMode } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: '100vh', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

export default function Home() {
  const [stops, setStops] = useState<Stop[]>(() => {
    if (typeof window === 'undefined') return [];

    const savedStops = localStorage.getItem('voyage_stops');
    return savedStops ? JSON.parse(savedStops) : [];
  });
  const [legs, setLegs] = useState<Leg[]>(() => {
    if (typeof window === 'undefined') return [];

    const savedLegs = localStorage.getItem('voyage_legs');
    return savedLegs ? JSON.parse(savedLegs) : [];
  });
  const [sidebarLevel, setSidebarLevel] = useState(1); // Default: 1 (Search bar visible)

  useEffect(() => {
    localStorage.setItem('voyage_stops', JSON.stringify(stops));
    localStorage.setItem('voyage_legs', JSON.stringify(legs));
  }, [stops, legs]);

  const handleAddStop = (newStop: Stop) => {
    setStops(prev => {
      const updated: Stop[] = [...prev, { ...newStop, tripType: 'ONE_WAY' }];
      rebuildLegs(updated);
      return updated;
    });
  };

  const handleRemoveStop = (id: string) => {
    setStops(prev => {
      const updated = prev.filter(s => s.id !== id);
      rebuildLegs(updated);
      return updated;
    });
  };

  const handleUpdateLegMode = (toId: string, mode: TransportMode) => {
    setLegs(prev => prev.map(l => 
      (l.toId === toId || (l.fromId === toId && l.isReturn)) ? { ...l, mode } : l
    ));
  };

  const handleToggleTripType = (id: string) => {
    setStops(prev => {
      const updated: Stop[] = prev.map(s => s.id === id ? { ...s, tripType: s.tripType === 'ROUND_TRIP' ? 'ONE_WAY' : 'ROUND_TRIP' } : s);
      rebuildLegs(updated);
      return updated;
    });
  };

  const rebuildLegs = (currentStops: Stop[]) => {
    const newLegs: Leg[] = [];
    if (currentStops.length < 2) {
      setLegs([]);
      return;
    }

    let currentBaseStop = currentStops[0];
    for (let i = 1; i < currentStops.length; i++) {
      const targetStop = currentStops[i];
      const existingLeg = legs.find(l => l.toId === targetStop.id && !l.isReturn);
      const mode = existingLeg ? existingLeg.mode : 'PLANE';

      newLegs.push({ fromId: currentBaseStop.id, toId: targetStop.id, mode });

      if (targetStop.tripType === 'ROUND_TRIP') {
        newLegs.push({ fromId: targetStop.id, toId: currentBaseStop.id, mode, isReturn: true });
      } else {
        currentBaseStop = targetStop;
      }
    }
    setLegs(newLegs);
  };

  const handleReorderStops = (newStops: Stop[]) => {
    setStops(newStops);
    rebuildLegs(newStops);
  };

  const handleClearAll = () => {
    if (confirm('Reset your itinerary?')) {
      setStops([]);
      setLegs([]);
    }
  };

  return (
    <main style={{ display: 'flex', height: '100%', width: '100%' }}>
      <Sidebar 
        stops={stops} 
        legs={legs} 
        onAddStop={handleAddStop}
        onRemoveStop={handleRemoveStop}
        onUpdateLegMode={handleUpdateLegMode}
        onReorderStops={handleReorderStops}
        onClearAll={handleClearAll}
        onToggleTripType={handleToggleTripType}
        level={sidebarLevel}
        onLevelChange={setSidebarLevel}
      />
      <MapView stops={stops} legs={legs} level={sidebarLevel} />
    </main>
  );
}
