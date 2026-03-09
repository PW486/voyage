export type TransportMode = 'PLANE' | 'TRAIN' | 'BUS' | 'FERRY' | 'CAR' | 'BIKE' | 'WALK';
export type TripType = 'ONE_WAY' | 'ROUND_TRIP';

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tripType?: TripType;
}

export interface Leg {
  fromId: string;
  toId: string;
  mode: TransportMode;
  isReturn?: boolean;
}
