'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stop, Leg, TransportMode } from '@/types';
import { MapPin, Plane, Train, Car, Bus, Footprints, Plus, Search, Trash2, Loader2, Ship, Bike, RotateCcw, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface SidebarProps {
  stops: Stop[];
  legs: Leg[];
  onAddStop: (stop: Stop) => void;
  onRemoveStop: (id: string) => void;
  onUpdateLegMode: (toId: string, mode: TransportMode) => void;
  onReorderStops: (newStops: Stop[]) => void;
  onClearAll: () => void;
  onToggleTripType: (id: string) => void;
  level: number;
  onLevelChange: (level: number) => void;
}

interface SearchResult {
  id: string | number;
  name: string;
  context: string;
  lat: number;
  lng: number;
}

export default function Sidebar({ stops, legs, onAddStop, onRemoveStop, onUpdateLegMode, onReorderStops, onClearAll, onToggleTripType, level, onLevelChange }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Touch Drag State
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    setDragY(deltaY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snapping Logic
    // If dragged enough (50px), move to next/prev level
    if (Math.abs(dragY) > 50) {
      if (dragY < -50 && level < 2) {
        onLevelChange(level + 1);
      } else if (dragY > 50 && level > 0) {
        onLevelChange(level - 1);
      }
    }
    setDragY(0);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=10&lang=en`);
          const data = await response.json();
          const mappedResults: SearchResult[] = data.features.map((f: any, index: number) => {
            const p = f.properties;
            return {
              id: `${p.osm_id || index}-${index}`,
              name: p.name || '',
              context: [p.city, p.state, p.country].filter(Boolean).join(', '),
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            };
          });
          const uniqueResults = mappedResults.reduce((acc: SearchResult[], current) => {
            if (!acc.find(item => item.name === current.name && item.context === current.context) && current.name) acc.push(current);
            return acc;
          }, []).slice(0, 5);
          setResults(uniqueResults);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
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

  const handleAddStop = (res: SearchResult) => {
    onAddStop({ id: Math.random().toString(36).substr(2, 9), name: res.name, lat: res.lat, lng: res.lng });
    setSearchTerm('');
    setResults([]);
    // On mobile, if a stop is added, maybe keep sidebar open or closed? 
    // Let's keep it open for now.
  };

  const getTransportIcon = useCallback((mode: TransportMode) => {
    const size = 14;
    switch (mode) {
      case 'PLANE': return <Plane size={size} />;
      case 'TRAIN': return <Train size={size} />;
      case 'BUS': return <Bus size={size} />;
      case 'FERRY': return <Ship size={size} />;
      case 'CAR': return <Car size={size} />;
      case 'BIKE': return <Bike size={size} />;
      case 'WALK': return <Footprints size={size} />;
    }
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      const getVisibleHeight = (lvl: number) => {
        switch (lvl) {
          case 0: return '28px';
          case 1: return '137px';
          case 2: return '70svh';
          default: return '137px';
        }
      };
      const h = getVisibleHeight(level);
      // Sync the CSS variable with the total physical height of the sidebar
      document.documentElement.style.setProperty('--sidebar-visible-height', `calc(${h} - ${dragY}px + env(safe-area-inset-bottom, 0px))`);

    } else {
      document.documentElement.style.removeProperty('--sidebar-visible-height');
    }
  }, [level, dragY, isMobile]);

  const modes: TransportMode[] = ['PLANE', 'TRAIN', 'BUS', 'FERRY', 'CAR', 'BIKE', 'WALK'];

  const getLevelHeightString = (lvl: number) => {
    switch (lvl) {
      case 0: return '28px';
      case 1: return '137px';
      case 2: return '70svh';
      default: return '137px';
    }
  };

  const currentHeight = isMobile ? getLevelHeightString(level) : '100%';

  return (
    <div 
      className={`sidebar level-${level}`}
      style={isMobile ? {
        transform: 'none',
        height: isMobile && level < 2 ? `calc(${currentHeight} - ${dragY}px)` : currentHeight,
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        bottom: 0,
        top: 'auto',
        display: 'flex',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      } : {}}
    >
      <div 
        className="mobile-handle" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (level < 2) onLevelChange(level + 1);
          else onLevelChange(1);
        }}
        style={isMobile ? { height: level === 0 ? '100%' : '28px', minHeight: '28px' } : {}}
      >
        <div className="handle-bar" />
      </div>
      
      <div style={{ padding: isMobile ? '0rem 1.25rem 1.25rem 1.25rem' : '2rem 1.5rem 2rem 1.5rem', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.5rem' : '1.5rem', minHeight: '38px' }}>
          <h1 style={{ color: 'var(--primary-navy)', fontSize: isMobile ? '1.25rem' : '1.5rem', margin: 0 }}>Bon Voyage</h1>
          <div style={{ display: 'flex', gap: '0.5rem', minWidth: '85px', justifyContent: 'flex-end' }}>
            {stops.length > 0 && (
              <button 
                onClick={onClearAll} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '8px', 
                  background: '#fff1f0', 
                  color: '#ff4d4f', 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  border: '1px solid #ffccc7',
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '12px', padding: '0 0.75rem' }}>
            {isLoading ? <Loader2 size={18} className="animate-spin" color="var(--text-muted)" /> : <Search size={18} color="var(--text-muted)" />}
            <input 
              type="text" 
              placeholder="Add a destination..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              onFocus={() => {
                setIsFocused(true);
                if (isMobile && level < 2) {
                  onLevelChange(2);
                }
              }}
              onBlur={() => {
                if (!isMobile) {
                  setTimeout(() => setIsFocused(false), 200);
                }
              }}
              style={{ width: '100%', padding: '0.75rem', paddingRight: '2rem', background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem' }} 
            />
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                  setIsFocused(false);
                }} 
                style={{ 
                  position: 'absolute', 
                  right: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#cbd5e1',
                  padding: '4px'
                }}
              >
                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            )}
          </div>
          {isFocused && (results.length > 0 || isLoading) && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #eee', borderRadius: '12px', marginTop: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100 }}>
              {isLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} /></div>
              ) : (
                results.map(res => (
                  <button 
                    key={res.id} 
                    onClick={() => {
                      handleAddStop(res);
                      setIsFocused(false);
                    }} 
                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', borderBottom: '1px solid #f8f9fa', color: 'var(--text-dark)' }}
                  >
                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px' }}><MapPin size={16} color="var(--primary-navy)" /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{res.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.context}</span>
                    </div>
                    <Plus size={14} color="#cbd5e1" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stops.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MapPin size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Ready to plan your next adventure?</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Search for a place to start.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="itinerary">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ padding: isMobile ? '0.5rem 0' : '1rem 0' }}>
                  {stops.map((stop, index) => (
                    <Draggable key={stop.id} draggableId={stop.id} index={index}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="itinerary-item" style={{ ...provided.draggableProps.style, padding: '0 1rem', background: snapshot.isDragging ? 'white' : 'transparent', zIndex: snapshot.isDragging ? 100 : 1 }}>
                          {index > 0 && (
                            <div className="transport-connector" style={{ height: '2.5rem', position: 'relative', left: '29px', width: '2px', background: '#e2e8f0', margin: '0' }}>
                              <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', display: 'flex', gap: '4px', padding: '4px', background: 'white', borderRadius: '20px', border: '1px solid #eee', boxShadow: 'var(--shadow)', zIndex: 10 }}>
                                {modes.map(m => {
                                  const isActive = legs.find(l => l.toId === stop.id && !l.isReturn)?.mode === m;
                                  return (
                                    <button 
                                      key={m} 
                                      onClick={() => onUpdateLegMode(stop.id, m)} 
                                      style={{ 
                                        padding: '6px', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        background: isActive ? 'var(--primary-navy)' : 'transparent', 
                                        color: isActive ? 'white' : 'var(--text-muted)' 
                                      }}
                                    >
                                      {getTransportIcon(m)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', padding: '0.5rem 0', background: 'white', borderRadius: '12px', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '50px', flexShrink: 0 }}>
                              <div {...provided.dragHandleProps} style={{ padding: '0.5rem 4px', color: '#cbd5e1', cursor: 'grab', display: 'flex', alignItems: 'center' }}><GripVertical size={18} /></div>
                              <div style={{ background: 'var(--primary-navy)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}><h3 style={{ fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stop.name}</h3></div>
                            {index > 0 && (
                              <button 
                                onClick={() => onToggleTripType(stop.id)} 
                                style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px', 
                                  fontSize: '0.7rem', 
                                  fontWeight: 600, 
                                  background: stop.tripType === 'ROUND_TRIP' ? '#e2e8f0' : '#f1f5f9', 
                                  color: '#64748b', 
                                  border: '1px solid', 
                                  borderColor: stop.tripType === 'ROUND_TRIP' ? '#cbd5e1' : '#e2e8f0', 
                                  marginRight: '0.5rem' 
                                }}
                              >
                                {stop.tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                              </button>
                            )}
                            <button onClick={() => onRemoveStop(stop.id)} style={{ padding: '0.5rem', color: '#ff4d4f' }}><Trash2 size={16} /></button>
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
        )}
      </div>
    </div>
  );
}
