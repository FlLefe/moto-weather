import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0F172A" },
        headerTintColor: "#F1F5F9",
        headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderTopColor: "#334155",
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "M\u00E9t\u00E9o",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="\u2600\uFE0F" />
          ),
          headerTitle: "M\u00E9t\u00E9o du jour",
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: "Pr\u00E9visions",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="\uD83D\uDCC5" />
          ),
          headerTitle: "Pr\u00E9visions J+7",
        }}
      />
      <Tabs.Screen
        name="moto"
        options={{
          title: "Trajet",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="\uD83C\uDFCD\uFE0F" />
          ),
          headerTitle: "Trajet Moto",
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
