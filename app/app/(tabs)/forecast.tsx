import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForecast } from "../../src/api/weather.api";
import { weatherCodeToEmoji } from "../../src/components/WeatherCard";
import RiskBadge from "../../src/components/RiskBadge";
import type { DailyForecast } from "../../src/types";

const DAYS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const MONTHS_FR = [
  "janvier",
  "f\u00E9vrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "ao\u00FBt",
  "septembre",
  "octobre",
  "novembre",
  "d\u00E9cembre",
];

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = DAYS_FR[d.getDay()];
  const num = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  return `${day} ${num} ${month}`;
}

export default function ForecastScreen() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  const forecast = useForecast(lat, lon, 7);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(loc.coords.latitude);
      setLon(loc.coords.longitude);
    })();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await forecast.refetch();
    setRefreshing(false);
  }, [forecast]);

  const renderDay = ({ item }: { item: DailyForecast }) => {
    const emoji = weatherCodeToEmoji(item.weather_code);
    return (
      <View className="bg-card rounded-2xl p-4 mb-3 flex-row items-center">
        <Text className="text-3xl mr-3">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-text text-base font-bold">
            {formatDateFr(item.date)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-accent text-lg font-bold mr-1">
              {Math.round(item.temp_max)}\u00B0
            </Text>
            <Text className="text-muted text-lg">
              / {Math.round(item.temp_min)}\u00B0
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            {item.precipitation_sum > 0 && (
              <Text className="text-muted text-sm mr-3">
                \uD83D\uDCA7 {item.precipitation_sum.toFixed(1)} mm
              </Text>
            )}
            <Text className="text-muted text-sm">
              \uD83D\uDCA8 {Math.round(item.wind_speed_max)} km/h
            </Text>
          </View>
        </View>
        <RiskBadge risk={item.risk_summary} size="small" />
      </View>
    );
  };

  if (forecast.isLoading && !forecast.data) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["bottom"]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-muted mt-3 text-base">
          Chargement des pr\u00E9visions...
        </Text>
      </SafeAreaView>
    );
  }

  if (forecast.error) {
    return (
      <SafeAreaView className="flex-1 bg-background px-4 justify-center" edges={["bottom"]}>
        <View className="bg-risk-red/20 rounded-xl p-4">
          <Text className="text-risk-red text-base text-center">
            Erreur de chargement des pr\u00E9visions
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <FlatList
        data={forecast.data ?? []}
        renderItem={renderDay}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-muted text-base">
              Aucune pr\u00E9vision disponible
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
