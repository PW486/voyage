export type TransportMode = 'PLANE' | 'TRAIN' | 'BUS' | 'FERRY' | 'CAR' | 'BIKE' | 'WALK';

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

export interface Leg {
  fromId: string;
  toId: string;
  mode: TransportMode;
}

export interface Trip {
  stops: Stop[];
  legs: Leg[];
}
