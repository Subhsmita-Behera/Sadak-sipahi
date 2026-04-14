import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Citizen Reporter");

  useEffect(() => {
    AsyncStorage.getItem("userName").then((n) => { if (n) setUserName(n); });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🚦 Sadak Sipahi</Text>
          <Text style={styles.subtitle}>Making Roads Safer Together</Text>
        </View>
        <TouchableOpacity
          style={styles.sos}
          onPress={() => router.push("/sos" as any)}
        >
          <Text style={styles.sosText}>⚠ SOS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Text style={styles.welcome}>Welcome Back 👋</Text>
          <Text style={styles.username}>{userName}</Text>
          <View style={styles.pointsBox}>
            <Text style={styles.points}>🏆 120 Reward Points</Text>
          </View>
        </View>

        <Text style={styles.section}>Report Traffic Issues</Text>
        <View style={styles.grid}>
          <ActionCard
            icon="photo-camera"
            title="Report Issue"
            color="#1976d2"
            onPress={() => router.push("/(tabs)/OcrReportScreen" as any)}
          />
          <ActionCard
            icon="edit"
            title="Manual Entry"
            color="#fb8c00"
            onPress={() => router.push("/manual" as any)}
          />
          <ActionCard
            icon="map"
            title="Heatmap"
            color="#43a047"
            onPress={() => router.push("/(tabs)/map" as any)}
          />
          <ActionCard
            icon="analytics"
            title="Track Status"
            color="#8e24aa"
            onPress={() => router.push("/status" as any)}
          />
        </View>

        <Text style={styles.section}>Information</Text>
        <View style={styles.grid}>
          <ActionCard
            icon="gavel"
            title="Traffic Rules"
            color="#e53935"
            onPress={() => router.push("/rules" as any)}
          />
          <ActionCard
            icon="help-outline"
            title="FAQ"
            color="#039be5"
            onPress={() => router.push("/faq" as any)}
          />
          <ActionCard
            icon="support-agent"
            title="Help & Support"
            color="#00897b"
            onPress={() => router.push("/support" as any)}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, title, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.actionCard, { borderTopColor: color }]}
    onPress={onPress}
  >
    <MaterialIcons name={icon} size={32} color={color} />
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6fb" },
  header: { backgroundColor: "#1976d2", padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#e3f2fd", marginTop: 4 },
  sos: { backgroundColor: "#ff1744", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  sosText: { color: "#fff", fontWeight: "bold" },
  profileCard: { backgroundColor: "#fff", margin: 20, padding: 20, borderRadius: 20, elevation: 4 },
  welcome: { fontSize: 16, color: "#555" },
  username: { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  pointsBox: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  points: { fontWeight: "bold" },
  section: { fontSize: 18, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginHorizontal: 20, marginTop: 15 },
  actionCard: { width: width * 0.42, backgroundColor: "#fff", padding: 22, borderRadius: 18, marginBottom: 16, borderTopWidth: 4, elevation: 5 },
  actionTitle: { marginTop: 10, fontWeight: "bold" },
});