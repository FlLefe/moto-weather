import React from "react";
import { View, Text } from "react-native";

interface Props {
  gear: {
    rain_gear: boolean;
    warm_layers: boolean;
    confidence: number;
  };
}

export default function GearRecommendation({ gear }: Props) {
  const confidencePct = Math.round(gear.confidence * 100);

  return (
    <View className="bg-card rounded-2xl p-4 mb-4">
      <Text className="text-text text-lg font-bold mb-3">
        \u00C9quipement recommand\u00E9
      </Text>

      <View className="flex-row justify-around mb-4">
        <GearItem
          emoji="\uD83E\uDDE5"
          label="\u00C9quipement pluie"
          needed={gear.rain_gear}
        />
        <GearItem
          emoji="\uD83E\uDDE3"
          label="Couches chaudes"
          needed={gear.warm_layers}
        />
      </View>

      <View>
        <Text className="text-muted text-sm mb-1">
          Confiance : {confidencePct}%
        </Text>
        <View className="h-2.5 bg-background rounded-full overflow-hidden">
          <View
            style={{ width: `${confidencePct}%` }}
            className="h-full bg-accent rounded-full"
          />
        </View>
      </View>
    </View>
  );
}

function GearItem({
  emoji,
  label,
  needed,
}: {
  emoji: string;
  label: string;
  needed: boolean;
}) {
  return (
    <View className="items-center">
      <Text className="text-4xl mb-1">{emoji}</Text>
      <Text className="text-text text-sm font-semibold mb-0.5">{label}</Text>
      <View
        className={`px-3 py-1 rounded-full ${
          needed ? "bg-risk-orange/20" : "bg-risk-green/20"
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            needed ? "text-risk-orange" : "text-risk-green"
          }`}
        >
          {needed ? "OUI" : "NON"}
        </Text>
      </View>
    </View>
  );
}
