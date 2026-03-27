import axios from 'axios';
import type { RouteSegment, WeatherPoint, MotoRiskScore } from '../types/index.js';

const OSRM_URL = process.env.OSRM_URL || 'http://osrm:5000';
const SEGMENT_TARGET_KM = 17.5; // target ~15-20km segments

interface OsrmStep {
  distance: number;
  duration: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  maneuver: {
    location: [number, number];
  };
}

interface OsrmLeg {
  distance: number;
  duration: number;
  steps: OsrmStep[];
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  legs: OsrmLeg[];
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}

function emptyWeather(): WeatherPoint {
  return {
    lat: 0,
    lon: 0,
    timestamp: '',
    temperature: 0,
    feels_like: 0,
    precipitation: 0,
    precipitation_probability: 0,
    wind_speed: 0,
    wind_gusts: 0,
    wind_direction: 0,
    is_freezing_risk: false,
    thunderstorm_risk: 0,
    visibility: 10,
    snow: 0,
    weather_code: 0,
  };
}

function emptyRisk(): MotoRiskScore {
  return {
    overall: 'green',
    score: 0,
    rain_risk: 0,
    wind_risk: 0,
    freeze_risk: 0,
    storm_risk: 0,
    visibility_risk: 0,
    recommendation: '',
    details: [],
  };
}

export async function getRouteSegments(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  departureTime: string,
): Promise<{ segments: RouteSegment[]; totalDistanceKm: number; totalDurationMin: number }> {
  const url = `${OSRM_URL}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;

  const response = await axios.get<OsrmResponse>(url, {
    params: {
      steps: 'true',
      geometries: 'geojson',
      overview: 'full',
      annotations: 'true',
    },
    timeout: 10000,
  });

  if (response.data.code !== 'Ok' || response.data.routes.length === 0) {
    throw new Error(`OSRM returned code: ${response.data.code}`);
  }

  const route = response.data.routes[0]!;
  const totalDistanceKm = route.distance / 1000;
  const totalDurationMin = route.duration / 60;
  const coordinates = route.geometry.coordinates; // [lon, lat][]

  const numSegments = Math.max(1, Math.round(totalDistanceKm / SEGMENT_TARGET_KM));
  const pointsPerSegment = Math.max(1, Math.floor(coordinates.length / numSegments));

  const departureDate = new Date(departureTime);
  const segments: RouteSegment[] = [];

  for (let i = 0; i < numSegments; i++) {
    const startIdx = i * pointsPerSegment;
    const endIdx = i === numSegments - 1
      ? coordinates.length - 1
      : Math.min((i + 1) * pointsPerSegment, coordinates.length - 1);

    const startCoord = coordinates[startIdx]!;
    const endCoord = coordinates[endIdx]!;

    const segmentDistanceKm = totalDistanceKm / numSegments;
    const segmentDurationSec = route.duration / numSegments;
    const cumulatedDurationSec = segmentDurationSec * (i + 0.5); // midpoint

    const eta = new Date(departureDate.getTime() + cumulatedDurationSec * 1000);

    segments.push({
      segment_index: i,
      start_coords: { lat: startCoord[1]!, lon: startCoord[0]! },
      end_coords: { lat: endCoord[1]!, lon: endCoord[0]! },
      estimated_arrival: eta.toISOString(),
      distance_km: Math.round(segmentDistanceKm * 10) / 10,
      weather: emptyWeather(),
      risk: emptyRisk(),
    });
  }

  return {
    segments,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMin: Math.round(totalDurationMin),
  };
}
