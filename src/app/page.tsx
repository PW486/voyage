'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { Stop, Leg, TransportMode } from '@/types';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: '100vh', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

export default function Home() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedStops = localStorage.getItem('voyage_stops');
    const savedLegs = localStorage.getItem('voyage_legs');
    if (savedStops) setStops(JSON.parse(savedStops));
    if (savedLegs) setLegs(JSON.parse(savedLegs));
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('voyage_stops', JSON.stringify(stops));
      localStorage.setItem('voyage_legs', JSON.stringify(legs));
    }
  }, [stops, legs, isLoaded]);

  const handleAddStop = (newStop: Stop) => {
    setStops(prev => {
      const updated = [...prev, newStop];
      if (prev.length > 0) {
        const lastStop = prev[prev.length - 1];
        setLegs(currentLegs => [
          ...currentLegs,
          { fromId: lastStop.id, toId: newStop.id, mode: 'PLANE' }
        ]);
      }
      return updated;
    });
  };

  const handleRemoveStop = (id: string) => {
    setStops(prev => {
      const index = prev.findIndex(s => s.id === id);
      const updated = prev.filter(s => s.id !== id);
      
      setLegs(currentLegs => {
        let newLegs = currentLegs.filter(l => l.fromId !== id && l.toId !== id);
        if (index > 0 && index < prev.length - 1) {
          const prevStop = prev[index - 1];
          const nextStop = prev[index + 1];
          newLegs.push({ fromId: prevStop.id, toId: nextStop.id, mode: 'PLANE' });
        }
        return newLegs;
      });
      
      return updated;
    });
  };

  const handleUpdateLegMode = (fromId: string, toId: string, mode: TransportMode) => {
    setLegs(prev => prev.map(l => 
      (l.fromId === fromId && l.toId === toId) ? { ...l, mode } : l
    ));
  };

  const handleReorderStops = (newStops: Stop[]) => {
    setStops(newStops);
    // Rebuild legs based on new order, preserving the mode used to arrive at each destination
    setLegs(prevLegs => {
      const newLegs: Leg[] = [];
      for (let i = 0; i < newStops.length - 1; i++) {
        const fromId = newStops[i].id;
        const toId = newStops[i + 1].id;
        // Find if there was a mode previously associated with getting TO this specific destination
        const existingLeg = prevLegs.find(l => l.toId === toId);
        newLegs.push({
          fromId,
          toId,
          mode: existingLeg ? existingLeg.mode : 'PLANE'
        });
      }
      return newLegs;
    });
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your entire itinerary?')) {
      setStops([]);
      setLegs([]);
    }
  };

  const triggerResetView = () => {
    setResetTrigger(prev => prev + 1);
  };

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar 
        stops={stops} 
        legs={legs} 
        onAddStop={handleAddStop}
        onRemoveStop={handleRemoveStop}
        onUpdateLegMode={handleUpdateLegMode}
        onReorderStops={handleReorderStops}
        onClearAll={handleClearAll}
        onResetView={triggerResetView}
      />
      <MapView stops={stops} legs={legs} resetTrigger={resetTrigger} />
    </main>
  );
}
