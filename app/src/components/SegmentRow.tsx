import React from "react";
import { View, Text } from "react-native";
import type { RouteSegment } from "../types";
import { weatherCodeToEmoji } from "./WeatherCard";
import RiskBadge from "./RiskBadge";

interface Props {
  segment: RouteSegment;
}

export default function SegmentRow({ segment }: Props) {
  const eta = new Date(segment.estimated_arrival);
  const timeStr = eta.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const emoji = weatherCodeToEmoji(segment.weather.weather_code);

  return (
    <View className="bg-card rounded-xl p-3 mb-2 flex-row items-center">
      <View className="w-8 h-8 bg-accent/20 rounded-full items-center justify-center mr-3">
        <Text className="text-accent text-sm font-bold">
          {segment.segment_index + 1}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-text text-base font-semibold">
          {timeStr} \u2014 {segment.distance_km.toFixed(1)} km
        </Text>
        <Text className="text-muted text-sm">
          {Math.round(segment.weather.temperature)}\u00B0C \u2022{" "}
          {Math.round(segment.weather.wind_speed)} km/h
        </Text>
      </View>

      <Text className="text-2xl mr-3">{emoji}</Text>
      <RiskBadge risk={segment.risk} size="small" />
    </View>
  );
}
