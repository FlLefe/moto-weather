import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import WeatherCard from "../../src/components/WeatherCard";
import GearRecommendation from "../../src/components/GearRecommendation";
import HourlyChart from "../../src/components/HourlyChart";
import RiskBadge from "../../src/components/RiskBadge";
import { weatherCodeToEmoji } from "../../src/components/WeatherCard";
import {
  useCurrentWeather,
  useHourlyWeather,
  useGearCheck,
} from "../../src/api/weather.api";

export default function MeteoScreen() {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [cityName, setCityName] = useState<string>("Localisation...");
  const [locError, setLocError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const currentWeather = useCurrentWeather(lat, lon);
  const hourlyWeather = useHourlyWeather(lat, lon, todayStr);
  const gearCheck = useGearCheck(lat, lon, todayStr, 18);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError("Permission de localisation refus\u00E9e");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(loc.coords.latitude);
      setLon(loc.coords.longitude);

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        setCityName(geo.city || geo.subregion || geo.region || "Position actuelle");
      }
    } catch {
      setLocError("Impossible d'obtenir la position");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      currentWeather.refetch(),
      hourlyWeather.refetch(),
      gearCheck.refetch(),
    ]);
    setRefreshing(false);
  }, [currentWeather, hourlyWeather, gearCheck]);

  const isLoading =
    currentWeather.isLoading || hourlyWeather.isLoading || gearCheck.isLoading;

  const next3Hours = hourlyWeather.data
    ? hourlyWeather.data
        .filter((h) => new Date(h.timestamp) >= new Date())
        .slice(0, 3)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* City header */}
        <View className="py-3">
          <Text className="text-text text-2xl font-bold">{cityName}</Text>
          {lat !== null && lon !== null && (
            <Text className="text-muted text-sm">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </Text>
          )}
        </View>

        {locError && (
          <View className="bg-risk-red/20 rounded-xl p-4 mb-4">
            <Text className="text-risk-red text-base text-center">
              {locError}
            </Text>
          </View>
        )}

        {isLoading && !currentWeather.data && (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-muted mt-3 text-base">
              Chargement de la m\u00E9t\u00E9o...
            </Text>
          </View>
        )}

        {currentWeather.error && (
          <View className="bg-risk-red/20 rounded-xl p-4 mb-4">
            <Text className="text-risk-red text-base text-center">
              Erreur de chargement de la m\u00E9t\u00E9o
            </Text>
          </View>
        )}

        {/* Current weather */}
        {currentWeather.data && <WeatherCard weather={currentWeather.data} />}

        {/* Gear recommendation */}
        {gearCheck.data && (
          <>
            <GearRecommendation
              gear={{
                rain_gear: gearCheck.data.rain_gear,
                warm_layers: gearCheck.data.warm_layers,
                confidence: gearCheck.data.confidence,
              }}
            />
            <RiskBadge risk={gearCheck.data.risk} size="large" />
          </>
        )}

        {/* Hourly chart */}
        {hourlyWeather.data && <HourlyChart hours={hourlyWeather.data} />}

        {/* Next 3 hours detail */}
        {next3Hours.length > 0 && (
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-text text-lg font-bold mb-3">
              Prochaines heures
            </Text>
            {next3Hours.map((h, i) => {
              const t = new Date(h.timestamp);
              const hStr = t.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <View
                  key={i}
                  className="flex-row items-center justify-between py-2 border-b border-muted/10"
                >
                  <Text className="text-muted text-base w-14">{hStr}</Text>
                  <Text className="text-xl">
                    {weatherCodeToEmoji(h.weather_code)}
                  </Text>
                  <Text className="text-text text-lg font-semibold w-14 text-center">
                    {Math.round(h.temperature)}\u00B0C
                  </Text>
                  <Text className="text-muted text-sm w-20 text-right">
                    {h.precipitation > 0
                      ? `${h.precipitation} mm`
                      : "Pas de pluie"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
