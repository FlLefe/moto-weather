import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import type { WeatherPoint, DailyForecast } from '../types/index.js';

const currentCache = new NodeCache({ stdTTL: 600 });     // 10 min
const hourlyCache = new NodeCache({ stdTTL: 1800 });      // 30 min
const forecastCache = new NodeCache({ stdTTL: 3600 });    // 1 hour

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 5000;
const MAX_RETRIES = 1;

const HOURLY_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'rain',
  'snowfall',
  'weathercode',
  'windspeed_10m',
  'windgusts_10m',
  'winddirection_10m',
  'visibility',
  'cape',
].join(',');

const DAILY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'windspeed_10m_max',
  'weathercode',
].join(',');

function roundCoord(val: number): number {
  return Math.round(val * 100) / 100;
}

function cacheKey(prefix: string, lat: number, lon: number, extra?: string): string {
  const key = `${prefix}:${roundCoord(lat)},${roundCoord(lon)}`;
  return extra ? `${key}:${extra}` : key;
}

async function fetchWithRetry<T>(url: string, params: Record<string, string | number>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get<T>(url, {
        params,
        timeout: TIMEOUT_MS,
      });
      return response.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}

interface OpenMeteoHourlyResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    snowfall: number[];
    weathercode: number[];
    windspeed_10m: number[];
    windgusts_10m: number[];
    winddirection_10m: number[];
    visibility: number[];
    cape: number[];
  };
}

interface OpenMeteoDailyResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  };
}

function mapHourlyToWeatherPoint(
  data: OpenMeteoHourlyResponse,
  index: number,
  lat: number,
  lon: number,
): WeatherPoint {
  const h = data.hourly;
  const cape = h.cape[index] ?? 0;
  let thunderstormRisk = 0;
  if (cape > 2000) thunderstormRisk = 3;
  else if (cape > 1000) thunderstormRisk = 2;
  else if (cape > 500) thunderstormRisk = 1;

  const temp = h.temperature_2m[index] ?? 0;
  const visibility = h.visibility[index] ?? 10000;

  return {
    lat,
    lon,
    timestamp: h.time[index] ?? '',
    temperature: temp,
    feels_like: h.apparent_temperature[index] ?? temp,
    precipitation: h.precipitation[index] ?? 0,
    precipitation_probability: h.precipitation_probability[index] ?? 0,
    wind_speed: h.windspeed_10m[index] ?? 0,
    wind_gusts: h.windgusts_10m[index] ?? 0,
    wind_direction: h.winddirection_10m[index] ?? 0,
    is_freezing_risk: temp < 4,
    thunderstorm_risk: thunderstormRisk,
    visibility: visibility / 1000, // convert m to km
    snow: h.snowfall[index] ?? 0,
    weather_code: h.weathercode[index] ?? 0,
  };
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherPoint> {
  const key = cacheKey('current', lat, lon);
  const cached = currentCache.get<WeatherPoint>(key);
  if (cached) return cached;

  const data = await fetchWithRetry<OpenMeteoHourlyResponse>(OPEN_METEO_BASE, {
    latitude: roundCoord(lat),
    longitude: roundCoord(lon),
    hourly: HOURLY_VARIABLES,
    forecast_days: 1,
    timezone: 'auto',
  });

  const now = new Date();
  const times = data.hourly.time;
  let closestIdx = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]!).getTime() - now.getTime());
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }

  const point = mapHourlyToWeatherPoint(data, closestIdx, lat, lon);
  currentCache.set(key, point);
  return point;
}

export async function getHourlyWeather(lat: number, lon: number, date: string): Promise<WeatherPoint[]> {
  const key = cacheKey('hourly', lat, lon, date);
  const cached = hourlyCache.get<WeatherPoint[]>(key);
  if (cached) return cached;

  const data = await fetchWithRetry<OpenMeteoHourlyResponse>(OPEN_METEO_BASE, {
    latitude: roundCoord(lat),
    longitude: roundCoord(lon),
    hourly: HOURLY_VARIABLES,
    start_date: date,
    end_date: date,
    timezone: 'auto',
  });

  const points: WeatherPoint[] = [];
  for (let i = 0; i < data.hourly.time.length; i++) {
    points.push(mapHourlyToWeatherPoint(data, i, lat, lon));
  }

  hourlyCache.set(key, points);
  return points;
}

export async function getForecast(lat: number, lon: number, days: number): Promise<DailyForecast[]> {
  const key = cacheKey('forecast', lat, lon, String(days));
  const cached = forecastCache.get<DailyForecast[]>(key);
  if (cached) return cached;

  const data = await fetchWithRetry<OpenMeteoDailyResponse>(OPEN_METEO_BASE, {
    latitude: roundCoord(lat),
    longitude: roundCoord(lon),
    daily: DAILY_VARIABLES,
    forecast_days: days,
    timezone: 'auto',
  });

  const forecasts: DailyForecast[] = data.daily.time.map((time, i) => ({
    date: time,
    temp_min: data.daily.temperature_2m_min[i] ?? 0,
    temp_max: data.daily.temperature_2m_max[i] ?? 0,
    precipitation_sum: data.daily.precipitation_sum[i] ?? 0,
    wind_speed_max: data.daily.windspeed_10m_max[i] ?? 0,
    weather_code: data.daily.weathercode[i] ?? 0,
    risk_summary: undefined as never, // filled by the route handler
  }));

  forecastCache.set(key, forecasts);
  return forecasts;
}

export async function getWeatherAtTime(lat: number, lon: number, time: string): Promise<WeatherPoint> {
  const targetDate = new Date(time);
  const dateStr = targetDate.toISOString().slice(0, 10);

  const hourlyData = await getHourlyWeather(lat, lon, dateStr);

  let closestIdx = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < hourlyData.length; i++) {
    const diff = Math.abs(new Date(hourlyData[i]!.timestamp).getTime() - targetDate.getTime());
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }

  return hourlyData[closestIdx]!;
}
