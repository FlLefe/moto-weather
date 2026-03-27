import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { MotoRiskScore } from "../types";

const RISK_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  orange: "#F97316",
  red: "#EF4444",
};

const RISK_LABELS: Record<string, string> = {
  green: "Favorable",
  yellow: "Prudence",
  orange: "D\u00E9conseill\u00E9",
  red: "Dangereux",
};

interface Props {
  risk: MotoRiskScore;
  size?: "small" | "large";
}

export default function RiskBadge({ risk, size = "small" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = RISK_COLORS[risk.overall] ?? RISK_COLORS.green;

  if (size === "small") {
    return (
      <View className="flex-row items-center">
        <View
          style={{ backgroundColor: color }}
          className="w-4 h-4 rounded-full mr-1.5"
        />
        <Text className="text-text text-base font-bold">{risk.score}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="bg-card rounded-2xl p-4 mb-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            style={{ backgroundColor: color }}
            className="w-6 h-6 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="text-text text-xl font-bold">
              {RISK_LABELS[risk.overall]} ({risk.score}/100)
            </Text>
            <Text className="text-muted text-sm mt-0.5">
              {risk.recommendation}
            </Text>
          </View>
        </View>
        <Text className="text-muted text-lg">{expanded ? "\u25B2" : "\u25BC"}</Text>
      </View>

      {expanded && (
        <View className="mt-3 pt-3 border-t border-muted/20">
          <RiskRow label="Pluie" value={risk.rain_risk} />
          <RiskRow label="Vent" value={risk.wind_risk} />
          <RiskRow label="Gel" value={risk.freeze_risk} />
          <RiskRow label="Orage" value={risk.storm_risk} />
          <RiskRow label="Visibilit\u00E9" value={risk.visibility_risk} />

          {risk.details.length > 0 && (
            <View className="mt-2">
              {risk.details.map((d, i) => (
                <Text key={i} className="text-muted text-sm mb-1">
                  \u2022 {d}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function RiskRow({ label, value }: { label: string; value: number }) {
  const pct = Math.min(value, 100);
  const barColor =
    pct < 30 ? "#22C55E" : pct < 60 ? "#EAB308" : pct < 80 ? "#F97316" : "#EF4444";

  return (
    <View className="flex-row items-center mb-2">
      <Text className="text-muted text-sm w-20">{label}</Text>
      <View className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
        <View
          style={{ width: `${pct}%`, backgroundColor: barColor }}
          className="h-full rounded-full"
        />
      </View>
      <Text className="text-muted text-sm w-10 text-right">{value}</Text>
    </View>
  );
}
