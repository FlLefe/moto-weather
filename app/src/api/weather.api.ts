import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { WeatherPoint, DailyForecast, GearCheck } from "../types";

export function useCurrentWeather(lat: number | null, lon: number | null) {
  return useQuery<WeatherPoint>({
    queryKey: ["currentWeather", lat, lon],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/weather/current", {
        params: { lat, lon },
      });
      return data;
    },
    enabled: lat !== null && lon !== null,
    staleTime: 5 * 60_000,
  });
}

export function useHourlyWeather(
  lat: number | null,
  lon: number | null,
  date?: string
) {
  return useQuery<WeatherPoint[]>({
    queryKey: ["hourlyWeather", lat, lon, date],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/weather/hourly", {
        params: { lat, lon, date },
      });
      return data;
    },
    enabled: lat !== null && lon !== null,
    staleTime: 10 * 60_000,
  });
}

export function useForecast(
  lat: number | null,
  lon: number | null,
  days?: number
) {
  return useQuery<DailyForecast[]>({
    queryKey: ["forecast", lat, lon, days],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/weather/forecast", {
        params: { lat, lon, days },
      });
      return data;
    },
    enabled: lat !== null && lon !== null,
    staleTime: 15 * 60_000,
  });
}

export function useGearCheck(
  lat: number | null,
  lon: number | null,
  date?: string,
  returnHour?: number
) {
  return useQuery<GearCheck>({
    queryKey: ["gearCheck", lat, lon, date, returnHour],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/route/gear-check", {
        params: { lat, lon, date, return_hour: returnHour },
      });
      return data;
    },
    enabled: lat !== null && lon !== null,
    staleTime: 10 * 60_000,
  });
}
