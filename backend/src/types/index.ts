export interface WeatherPoint {
  lat: number;
  lon: number;
  timestamp: string;
  temperature: number;
  feels_like: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_gusts: number;
  wind_direction: number;
  is_freezing_risk: boolean;
  thunderstorm_risk: number;
  visibility: number;
  snow: number;
  weather_code: number;
}

export interface MotoRiskScore {
  overall: 'green' | 'yellow' | 'orange' | 'red';
  score: number;
  rain_risk: number;
  wind_risk: number;
  freeze_risk: number;
  storm_risk: number;
  visibility_risk: number;
  recommendation: string;
  details: string[];
}

export interface RouteSegment {
  segment_index: number;
  start_coords: { lat: number; lon: number };
  end_coords: { lat: number; lon: number };
  estimated_arrival: string;
  distance_km: number;
  weather: WeatherPoint;
  risk: MotoRiskScore;
}

export interface RouteWeatherAnalysis {
  departure: string;
  origin: { lat: number; lon: number; label: string };
  destination: { lat: number; lon: number; label: string };
  total_distance_km: number;
  total_duration_min: number;
  segments: RouteSegment[];
  global_risk: MotoRiskScore;
  gear_recommendation: {
    rain_gear: boolean;
    warm_layers: boolean;
    confidence: number;
  };
}

export interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_sum: number;
  wind_speed_max: number;
  weather_code: number;
  risk_summary: MotoRiskScore;
}

export interface GearCheck {
  rain_gear: boolean;
  warm_layers: boolean;
  worst_period: string;
  risk: MotoRiskScore;
  confidence: number;
}
