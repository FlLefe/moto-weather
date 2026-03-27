import React from "react";
import { View, Text } from "react-native";
import Svg, { Polyline, Rect, Text as SvgText, Line } from "react-native-svg";
import type { WeatherPoint } from "../types";

interface Props {
  hours: WeatherPoint[];
}

const CHART_W = 340;
const CHART_H = 180;
const PAD_TOP = 25;
const PAD_BOTTOM = 30;
const PAD_LEFT = 10;
const PAD_RIGHT = 10;

export default function HourlyChart({ hours }: Props) {
  if (!hours || hours.length === 0) {
    return (
      <View className="bg-card rounded-2xl p-4 mb-4 items-center justify-center h-48">
        <Text className="text-muted">Aucune donn\u00E9e horaire</Text>
      </View>
    );
  }

  const displayHours = hours.slice(0, 24);
  const temps = displayHours.map((h) => h.temperature);
  const precips = displayHours.map((h) => h.precipitation);

  const tempMin = Math.min(...temps) - 2;
  const tempMax = Math.max(...temps) + 2;
  const precipMax = Math.max(...precips, 1);

  const usableW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const usableH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const stepX = usableW / Math.max(displayHours.length - 1, 1);

  const tempPoints = displayHours
    .map((h, i) => {
      const x = PAD_LEFT + i * stepX;
      const y =
        PAD_TOP +
        usableH -
        ((h.temperature - tempMin) / (tempMax - tempMin)) * usableH;
      return `${x},${y}`;
    })
    .join(" ");

  const barW = Math.max(stepX * 0.5, 4);

  return (
    <View className="bg-card rounded-2xl p-4 mb-4">
      <Text className="text-text text-lg font-bold mb-2">
        Temp\u00E9rature & Pr\u00E9cipitations (24h)
      </Text>
      <View className="items-center">
        <Svg width={CHART_W} height={CHART_H}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PAD_TOP + usableH * (1 - frac);
            const temp = tempMin + (tempMax - tempMin) * frac;
            return (
              <React.Fragment key={frac}>
                <Line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={CHART_W - PAD_RIGHT}
                  y2={y}
                  stroke="#334155"
                  strokeWidth={0.5}
                />
                <SvgText x={2} y={y + 3} fontSize={8} fill="#94A3B8">
                  {Math.round(temp)}\u00B0
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Precipitation bars */}
          {displayHours.map((h, i) => {
            if (h.precipitation <= 0) return null;
            const x = PAD_LEFT + i * stepX - barW / 2;
            const barH =
              (h.precipitation / precipMax) * (usableH * 0.3);
            const y = PAD_TOP + usableH - barH;
            return (
              <Rect
                key={`p-${i}`}
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill="#3B82F6"
                opacity={0.4}
                rx={2}
              />
            );
          })}

          {/* Temperature line */}
          <Polyline
            points={tempPoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hour labels */}
          {displayHours.map((h, i) => {
            if (i % 3 !== 0) return null;
            const x = PAD_LEFT + i * stepX;
            const hour = new Date(h.timestamp).getHours();
            return (
              <SvgText
                key={`l-${i}`}
                x={x}
                y={CHART_H - 5}
                fontSize={9}
                fill="#94A3B8"
                textAnchor="middle"
              >
                {hour}h
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
