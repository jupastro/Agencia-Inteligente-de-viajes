
export enum TravelCategory {
  CULTURE = 'Cultura',
  GASTRONOMY = 'Gastronomía',
  NATURE = 'Naturaleza',
  LEISURE = 'Ocio',
  HISTORY = 'Historia',
  LOGISTICS = 'Logística',
  LODGING = 'Alojamiento'
}

export enum TravelPace {
  RELAXED = 'Relajado',
  BALANCED = 'Equilibrado',
  FAST = 'Intenso'
}

export enum BudgetLevel {
  LOW = 'Mochilero',
  MEDIUM = 'Estándar',
  HIGH = 'Lujo'
}

export interface Reservation {
  id: string;
  type: 'hotel' | 'vuelo' | 'entrada' | 'restaurante';
  title: string;
  detail: string;
  time?: string;
  location?: string;
  confirmationCode?: string;
  estimatedCost: number;
}

export interface Activity {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  poiId?: string;
  travelMode: 'walk' | 'transit' | 'car';
  travelDuration: string;
  category: TravelCategory;
  mapsSearchQuery?: string;
  estimatedCost: number;
}

export interface TripDay {
  dayNumber: number;
  activities: Activity[];
}

export interface TripBudget {
  totalEstimated: number;
  currency: string;
  level: BudgetLevel;
  breakdown: {
    lodging: number;
    food: number;
    activities: number;
    transport: number;
  };
}

export interface Trip {
  id: string;
  destination: string;
  durationDays: number;
  pace: TravelPace;
  interests: string[];
  mandatoryActivities?: string;
  numRestaurantsPerDay: number;
  itinerary: TripDay[];
  reservations: Reservation[];
  budget: TripBudget;
  generalTips: TravelTip[];
  status: 'planning' | 'upcoming' | 'active' | 'completed';
  createdAt: number;
}

export interface TravelTip {
  title: string;
  content: string;
  icon: string;
}
