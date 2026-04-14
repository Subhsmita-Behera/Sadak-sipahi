import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("role").then((r) => {
      setRole(r || "user");
    });
  }, []);

  if (role === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (role === "admin") {
    return (
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="AdminHome"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="AdminDashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="OcrReportScreen"
          options={{
            title: "Scan",
            tabBarIcon: ({ color }) => <Ionicons name="scan" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color }) => <Ionicons name="map" size={22} color={color} />,
          }}
        />
        
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="OcrReportlist" options={{ href: null }} />
        <Tabs.Screen name="OcrReportDetail" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Ionicons name="map" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="OcrReportScreen"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => <Ionicons name="scan" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="OcrReportlist"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="OcrReportDetail" options={{ href: null }} />
      <Tabs.Screen name="AdminHome" options={{ href: null }} />
      <Tabs.Screen name="AdminDashboard" options={{ href: null }} />
      <Tabs.Screen name="CctvMonitor" options={{ href: null }} />
      <Tabs.Screen name="CctvScreen" options={{ href: null }} />
    </Tabs>
  );
}