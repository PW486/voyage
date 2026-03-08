'use client';

import { useState, useEffect } from 'react';
import { Stop, Leg, TransportMode } from '@/types';
import { MapPin, Plane, Train, Car, Bus, Footprints, Plus, Search, Trash2, Loader2, Ship, Bike, Download, RotateCcw, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import domtoimage from 'dom-to-image-more';
import '../app/export.css';

interface SidebarProps {
  stops: Stop[];
  legs: Leg[];
  onAddStop: (stop: Stop) => void;
  onRemoveStop: (id: string) => void;
  onUpdateLegMode: (fromId: string, toId: string, mode: TransportMode) => void;
  onReorderStops: (newStops: Stop[]) => void;
  onClearAll: () => void;
  onResetView: () => void;
}

interface SearchResult {
  id: string | number;
  name: string;
  context: string;
  lat: number;
  lng: number;
}

export default function Sidebar({ stops, legs, onAddStop, onRemoveStop, onUpdateLegMode, onReorderStops, onClearAll, onResetView }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=10`);
          const data = await response.json();
          const mappedResults: SearchResult[] = data.features.map((f: any, index: number) => {
            const p = f.properties;
            const name = p.name || '';
            const context = [p.city, p.state, p.country].filter(Boolean).join(', ');
            return {
              id: `${p.osm_id || index}-${index}`,
              name: name,
              context: context,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            };
          });
          const uniqueResults = mappedResults.reduce((acc: SearchResult[], current) => {
            if (!acc.find(item => item.name.toLowerCase() === current.name.toLowerCase() && item.context.toLowerCase() === current.context.toLowerCase()) && current.name) acc.push(current);
            return acc;
          }, []).slice(0, 5);
          setResults(uniqueResults);
        } catch (error) { console.error('Search error:', error); }
        finally { setIsLoading(false); }
      } else { setResults([]); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorderStops(items);
  };

  const handleExport = async () => {
    if (stops.length === 0) return;
    setIsExporting(true);
    onResetView();
    const mapElement = document.querySelector('.map-container') as HTMLElement;
    if (mapElement) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const domtoimage = (await import('dom-to-image-more')).default;
        const dataUrl = await domtoimage.toPng(mapElement, {
          quality: 1,
          bgcolor: 'white',
          filter: (node) => node.classList ? !node.classList.contains('custom-zoom-control') && !node.classList.contains('leaflet-control-attribution') : true
        });
        const link = document.createElement('a');
        link.download = `voyage-map-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) { console.error('Export failed:', error); }
    }
    setIsExporting(false);
  };

  const handleAddStop = (res: SearchResult) => {
    onAddStop({
      id: Math.random().toString(36).substr(2, 9),
      name: res.name,
      lat: res.lat,
      lng: res.lng,
    });
    setSearchTerm('');
    setResults([]);
  };

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'PLANE': return <Plane size={14} />;
      case 'TRAIN': return <Train size={14} />;
      case 'BUS': return <Bus size={14} />;
      case 'FERRY': return <Ship size={14} />;
      case 'CAR': return <Car size={14} />;
      case 'BIKE': return <Bike size={14} />;
      case 'WALK': return <Footprints size={14} />;
      default: return <Plane size={14} />;
    }
  };

  const modes: TransportMode[] = ['PLANE', 'TRAIN', 'BUS', 'FERRY', 'CAR', 'BIKE', 'WALK'];

  return (
    <div className="sidebar">
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--primary-navy)', fontSize: '1.5rem', margin: 0 }}>Voyage</h1>
          <div className="export-btn-container" style={{ display: 'flex', gap: '0.5rem' }}>
            {stops.length > 0 && (
              <button onClick={onClearAll} className="delete-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', background: '#fff1f0', color: '#ff4d4f', fontSize: '0.9rem', fontWeight: 500, border: '1px solid #ffccc7' }}>
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            )}
            <button onClick={handleExport} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', background: isExporting ? '#e2e8f0' : 'var(--primary-navy)', color: 'white', fontSize: '0.9rem', fontWeight: 500, cursor: isExporting ? 'wait' : 'pointer' }}>
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div style={{ position: 'relative' }} className="search-container">
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '12px', padding: '0 0.75rem' }}>
            {isLoading ? <Loader2 size={18} className="animate-spin" color="var(--text-muted)" /> : <Search size={18} color="var(--text-muted)" />}
            <input type="text" placeholder="Search destination..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem' }} />
          </div>
          {results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #eee', borderRadius: '12px', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
              {results.map(res => (
                <button key={res.id} onClick={() => handleAddStop(res)} style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', borderBottom: '1px solid #f8f9fa' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px' }}><MapPin size={16} color="var(--primary-navy)" /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy)' }}>{res.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.context}</span>
                  </div>
                  <Plus size={14} color="#cbd5e1" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stops.length === 0 && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapPin size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Search for a place to start your itinerary.</p>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="itinerary">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} style={{ padding: '1rem 0' }}>
                {stops.map((stop, index) => (
                  <Draggable key={stop.id} draggableId={stop.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className="itinerary-item"
                        style={{ 
                          ...provided.draggableProps.style,
                          padding: '0 1.5rem',
                          background: snapshot.isDragging ? 'white' : 'transparent',
                          zIndex: snapshot.isDragging ? 100 : 1,
                          boxShadow: snapshot.isDragging ? '0 8px 25px rgba(0,0,0,0.1)' : 'none',
                        }}
                      >
                        {index > 0 && (
                          <div className="transport-connector" style={{ height: '2.5rem', position: 'relative', left: '53px', width: '2px', background: '#e2e8f0', margin: '0' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', display: 'flex', gap: '4px', padding: '4px', background: 'white', borderRadius: '20px', border: '1px solid #eee', boxShadow: 'var(--shadow)', zIndex: 10 }}>
                              {modes.map(m => (
                                <button key={m} onClick={() => onUpdateLegMode(stops[index-1].id, stop.id, m)} style={{ padding: '6px', borderRadius: '50%', display: 'flex', background: legs.find(l => l.toId === stop.id)?.mode === m ? 'var(--primary-navy)' : 'transparent', color: legs.find(l => l.toId === stop.id)?.mode === m ? 'white' : 'var(--text-muted)' }}>
                                  {getTransportIcon(m)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', padding: '0.5rem 0', background: 'white', borderRadius: '12px' }}>
                          <div {...provided.dragHandleProps} style={{ padding: '0.5rem', color: '#cbd5e1', cursor: 'grab' }}>
                            <GripVertical size={18} />
                          </div>
                          <div style={{ background: 'var(--primary-navy)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stop.name}</h3>
                          </div>
                          <button className="delete-btn" onClick={() => onRemoveStop(stop.id)} style={{ padding: '0.5rem', color: '#ff4d4f', flexShrink: 0 }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
