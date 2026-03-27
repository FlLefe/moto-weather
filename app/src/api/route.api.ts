import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { RouteWeatherAnalysis } from "../types";

interface AnalyzeRouteParams {
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  departure_time?: string;
}

export function useAnalyzeRoute() {
  return useMutation<RouteWeatherAnalysis, Error, AnalyzeRouteParams>({
    mutationFn: async (params) => {
      const { data } = await apiClient.post("/api/route/analyze", params);
      return data;
    },
  });
}
