import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as Location from "expo-location";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useAnalyzeRoute } from "../../src/api/route.api";
import SegmentRow from "../../src/components/SegmentRow";
import RiskBadge from "../../src/components/RiskBadge";
import GearRecommendation from "../../src/components/GearRecommendation";
import type { NominatimResult, RouteWeatherAnalysis } from "../../src/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function MotoScreen() {
  const [departText, setDepartText] = useState("");
  const [arriveeText, setArriveeText] = useState("");
  const [departCoords, setDepartCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [arriveeCoords, setArriveeCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [departSuggestions, setDepartSuggestions] = useState<
    NominatimResult[]
  >([]);
  const [arriveeSuggestions, setArriveeSuggestions] = useState<
    NominatimResult[]
  >([]);
  const [showDepartSugg, setShowDepartSugg] = useState(false);
  const [showArriveeSugg, setShowArriveeSugg] = useState(false);

  const [departureDate, setDepartureDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const analyzeRoute = useAnalyzeRoute();
  const [result, setResult] = useState<RouteWeatherAnalysis | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Prefill departure with geolocation
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setDepartCoords({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          const name =
            geo.city || geo.subregion || geo.region || "Position actuelle";
          setDepartText(name);
        }
      } catch {
        // Ignore
      }
    })();
  }, []);

  const searchNominatim = useCallback(
    async (
      query: string,
      setter: (r: NominatimResult[]) => void,
      showSetter: (v: boolean) => void
    ) => {
      if (query.length < 3) {
        setter([]);
        showSetter(false);
        return;
      }
      try {
        const { data } = await axios.get<NominatimResult[]>(NOMINATIM_URL, {
          params: {
            q: query,
            format: "json",
            countrycodes: "fr",
            limit: 5,
          },
          headers: { "User-Agent": "MotoWeather/1.0" },
        });
        setter(data);
        showSetter(data.length > 0);
      } catch {
        setter([]);
        showSetter(false);
      }
    },
    []
  );

  const onDepartChange = (text: string) => {
    setDepartText(text);
    setDepartCoords(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => searchNominatim(text, setDepartSuggestions, setShowDepartSugg),
      400
    );
  };

  const onArriveeChange = (text: string) => {
    setArriveeText(text);
    setArriveeCoords(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => searchNominatim(text, setArriveeSuggestions, setShowArriveeSugg),
      400
    );
  };

  const selectDepart = (item: NominatimResult) => {
    setDepartText(item.display_name.split(",")[0]);
    setDepartCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setShowDepartSugg(false);
  };

  const selectArrivee = (item: NominatimResult) => {
    setArriveeText(item.display_name.split(",")[0]);
    setArriveeCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setShowArriveeSugg(false);
  };

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setDepartureDate((prev) => {
        const d = new Date(date);
        d.setHours(prev.getHours(), prev.getMinutes());
        return d;
      });
    }
  };

  const onTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setDepartureDate((prev) => {
        const d = new Date(prev);
        d.setHours(date.getHours(), date.getMinutes());
        return d;
      });
    }
  };

  const handleAnalyze = () => {
    if (!departCoords || !arriveeCoords) return;
    setResult(null);
    analyzeRoute.mutate(
      {
        origin_lat: departCoords.lat,
        origin_lon: departCoords.lon,
        destination_lat: arriveeCoords.lat,
        destination_lon: arriveeCoords.lon,
        departure_time: departureDate.toISOString(),
      },
      {
        onSuccess: (data) => setResult(data),
      }
    );
  };

  const canAnalyze = departCoords !== null && arriveeCoords !== null;

  const dateFr = departureDate.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFr = departureDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Departure input */}
          <Text className="text-text text-base font-semibold mt-4 mb-1">
            D\u00E9part
          </Text>
          <TextInput
            className="bg-card text-text text-lg rounded-xl px-4 py-3 mb-1"
            placeholder="Ville de d\u00E9part..."
            placeholderTextColor="#94A3B8"
            value={departText}
            onChangeText={onDepartChange}
            onFocus={() => departSuggestions.length > 0 && setShowDepartSugg(true)}
          />
          {showDepartSugg && (
            <View className="bg-card rounded-xl mb-2 overflow-hidden">
              {departSuggestions.map((item) => (
                <Pressable
                  key={item.place_id}
                  onPress={() => selectDepart(item)}
                  className="px-4 py-3 border-b border-muted/10"
                >
                  <Text className="text-text text-sm" numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Arrival input */}
          <Text className="text-text text-base font-semibold mt-2 mb-1">
            Arriv\u00E9e
          </Text>
          <TextInput
            className="bg-card text-text text-lg rounded-xl px-4 py-3 mb-1"
            placeholder="Ville d'arriv\u00E9e..."
            placeholderTextColor="#94A3B8"
            value={arriveeText}
            onChangeText={onArriveeChange}
            onFocus={() =>
              arriveeSuggestions.length > 0 && setShowArriveeSugg(true)
            }
          />
          {showArriveeSugg && (
            <View className="bg-card rounded-xl mb-2 overflow-hidden">
              {arriveeSuggestions.map((item) => (
                <Pressable
                  key={item.place_id}
                  onPress={() => selectArrivee(item)}
                  className="px-4 py-3 border-b border-muted/10"
                >
                  <Text className="text-text text-sm" numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Date/time picker */}
          <Text className="text-text text-base font-semibold mt-3 mb-1">
            Date & heure de d\u00E9part
          </Text>
          <View className="flex-row mb-4">
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="bg-card rounded-xl px-4 py-3 mr-2 flex-1"
            >
              <Text className="text-text text-base">{dateFr}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="bg-card rounded-xl px-4 py-3 flex-1"
            >
              <Text className="text-text text-base">{timeFr}</Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={departureDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={departureDate}
              mode="time"
              display="default"
              is24Hour={true}
              onChange={onTimeChange}
            />
          )}

          {/* Analyze button */}
          <Pressable
            onPress={handleAnalyze}
            disabled={!canAnalyze || analyzeRoute.isPending}
            className={`rounded-xl py-4 items-center mb-6 ${
              canAnalyze && !analyzeRoute.isPending
                ? "bg-accent"
                : "bg-accent/40"
            }`}
          >
            {analyzeRoute.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Analyser le trajet
              </Text>
            )}
          </Pressable>

          {/* Error */}
          {analyzeRoute.isError && (
            <View className="bg-risk-red/20 rounded-xl p-4 mb-4">
              <Text className="text-risk-red text-base text-center">
                Erreur lors de l'analyse du trajet
              </Text>
            </View>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary */}
              <View className="bg-card rounded-2xl p-4 mb-4">
                <Text className="text-text text-xl font-bold mb-2">
                  R\u00E9sum\u00E9 du trajet
                </Text>
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text className="text-muted text-sm">Distance</Text>
                    <Text className="text-text text-lg font-bold">
                      {result.total_distance_km.toFixed(0)} km
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-muted text-sm">Dur\u00E9e</Text>
                    <Text className="text-text text-lg font-bold">
                      {Math.floor(result.total_duration_min / 60)}h
                      {String(
                        Math.round(result.total_duration_min % 60)
                      ).padStart(2, "0")}
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-muted text-sm">Segments</Text>
                    <Text className="text-text text-lg font-bold">
                      {result.segments.length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Global risk */}
              <RiskBadge risk={result.global_risk} size="large" />

              {/* Gear */}
              <GearRecommendation gear={result.gear_recommendation} />

              {/* Segments */}
              <Text className="text-text text-lg font-bold mb-2">
                D\u00E9tail par segment
              </Text>
              {result.segments.map((seg) => (
                <SegmentRow key={seg.segment_index} segment={seg} />
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
