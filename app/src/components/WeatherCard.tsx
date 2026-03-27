import React from "react";
import { View, Text } from "react-native";
import type { WeatherPoint } from "../types";

const WMO_EMOJI: Record<number, string> = {
  0: "\u2600\uFE0F",
  1: "\u26C5",
  2: "\u26C5",
  3: "\u26C5",
  45: "\uD83C\uDF2B\uFE0F",
  48: "\uD83C\uDF2B\uFE0F",
  51: "\uD83C\uDF26\uFE0F",
  53: "\uD83C\uDF26\uFE0F",
  55: "\uD83C\uDF26\uFE0F",
  56: "\uD83C\uDF26\uFE0F",
  57: "\uD83C\uDF26\uFE0F",
  61: "\uD83C\uDF27\uFE0F",
  63: "\uD83C\uDF27\uFE0F",
  65: "\uD83C\uDF27\uFE0F",
  66: "\uD83C\uDF27\uFE0F",
  67: "\uD83C\uDF27\uFE0F",
  71: "\uD83C\uDF28\uFE0F",
  73: "\uD83C\uDF28\uFE0F",
  75: "\uD83C\uDF28\uFE0F",
  77: "\uD83C\uDF28\uFE0F",
  80: "\uD83C\uDF27\uFE0F",
  81: "\uD83C\uDF27\uFE0F",
  82: "\uD83C\uDF27\uFE0F",
  85: "\uD83C\uDF28\uFE0F",
  86: "\uD83C\uDF28\uFE0F",
  95: "\u26C8\uFE0F",
  96: "\u26C8\uFE0F",
  99: "\u26C8\uFE0F",
};

export function weatherCodeToEmoji(code: number): string {
  if (WMO_EMOJI[code]) return WMO_EMOJI[code];
  if (code >= 1 && code <= 3) return "\u26C5";
  if (code >= 51 && code <= 57) return "\uD83C\uDF26\uFE0F";
  if (code >= 61 && code <= 67) return "\uD83C\uDF27\uFE0F";
  if (code >= 71 && code <= 77) return "\uD83C\uDF28\uFE0F";
  if (code >= 80 && code <= 82) return "\uD83C\uDF27\uFE0F";
  if (code >= 85 && code <= 86) return "\uD83C\uDF28\uFE0F";
  if (code >= 95 && code <= 99) return "\u26C8\uFE0F";
  return "\u2600\uFE0F";
}

interface Props {
  weather: WeatherPoint;
}

export default function WeatherCard({ weather }: Props) {
  const emoji = weatherCodeToEmoji(weather.weather_code);
  const windDir = getWindDirection(weather.wind_direction);

  return (
    <View className="bg-card rounded-2xl p-5 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-6xl">{emoji}</Text>
        <View className="items-end">
          <Text className="text-text text-5xl font-bold">
            {Math.round(weather.temperature)}\u00B0C
          </Text>
          <Text className="text-muted text-lg">
            Ressenti {Math.round(weather.feels_like)}\u00B0C
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mt-2">
        <View className="flex-1 items-center">
          <Text className="text-muted text-sm mb-1">Pluie</Text>
          <Text className="text-text text-lg font-semibold">
            {weather.precipitation} mm
          </Text>
          <Text className="text-muted text-xs">
            {weather.precipitation_probability}%
          </Text>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-muted text-sm mb-1">Vent</Text>
          <Text className="text-text text-lg font-semibold">
            {Math.round(weather.wind_speed)} km/h
          </Text>
          <Text className="text-muted text-xs">
            Raf. {Math.round(weather.wind_gusts)} {windDir}
          </Text>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-muted text-sm mb-1">Visibilit\u00E9</Text>
          <Text className="text-text text-lg font-semibold">
            {weather.visibility >= 1000
              ? `${(weather.visibility / 1000).toFixed(1)} km`
              : `${Math.round(weather.visibility)} m`}
          </Text>
        </View>
      </View>

      {weather.is_freezing_risk && (
        <View className="bg-risk-red/20 rounded-xl p-3 mt-3">
          <Text className="text-risk-red text-base font-semibold text-center">
            \u26A0\uFE0F Risque de gel
          </Text>
        </View>
      )}
    </View>
  );
}

function getWindDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}
