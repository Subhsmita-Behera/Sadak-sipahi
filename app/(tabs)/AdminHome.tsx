import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
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
const BASE_URL = "http://192.168.1.2:5000";

export default function AdminHome() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("userName").then((n) => { if (n) setAdminName(n); });
    axios.get(`${BASE_URL}/admin/stats`)
      .then((res) => setStats(res.data))
      .catch(() => console.log("Failed to load stats"));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🚦 Sadak Sipahi</Text>
          <Text style={styles.subtitle}>Admin Control Panel</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await AsyncStorage.clear();
            router.replace("/login" as any);
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{adminName?.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.welcome}>Welcome Back 👋</Text>
              <Text style={styles.username}>{adminName}</Text>
              <Text style={styles.role}>🛡️ Administrator</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOcr ?? 0}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: "#ff9800" }]}>
              <Text style={[styles.statValue, { color: "#ff9800" }]}>{stats.pendingChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: "#4caf50" }]}>
              <Text style={[styles.statValue, { color: "#4caf50" }]}>{stats.paidChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: "#1976d2" }]}>
              <Text style={[styles.statValue, { color: "#1976d2" }]}>{stats.totalChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Challans</Text>
            </View>
          </View>
        )}

        {/* Revenue Card */}
        {stats && (
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue Collected</Text>
            <Text style={styles.revenueValue}>₹{(stats.totalRevenue ?? 0).toLocaleString()}</Text>
          </View>
        )}

        {/* Admin Actions */}
        <Text style={styles.section}>Admin Actions</Text>
        <View style={styles.grid}>
          <ActionCard
            icon="document-scanner"
            title="Scan Plate"
            color="#1976d2"
            onPress={() => router.push("/(tabs)/OcrReportScreen" as any)}
          />
          <ActionCard
            icon="assignment"
            title="All Reports"
            color="#fb8c00"
            onPress={() => router.push("/(tabs)/AdminDashboard" as any)}
          />
          <ActionCard
            icon="receipt"
            title="Challans"
            color="#e53935"
            onPress={() => router.push("/(tabs)/AdminDashboard" as any)}
          />
          <ActionCard
            icon="directions-car"
            title="Vehicles"
            color="#43a047"
            onPress={() => router.push("/(tabs)/AdminDashboard" as any)}
          />
          <ActionCard
            icon="people"
            title="Users"
            color="#8e24aa"
            onPress={() => router.push("/(tabs)/AdminDashboard" as any)}
          />
          <ActionCard
            icon="map"
            title="Heatmap"
            color="#00897b"
            onPress={() => router.push("/(tabs)/map" as any)}
          />
          <ActionCard
            icon="edit"
            title="Manual Entry"
            color="#f57c00"
            onPress={() => router.push("/manual" as any)}
          />
          <ActionCard
            icon="analytics"
            title="Track Status"
            color="#0288d1"
            onPress={() => router.push("/status" as any)}
          />
        </View>

        {/* Information */}
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
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#e3f2fd", marginTop: 4, fontSize: 13 },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  profileCard: { backgroundColor: "#fff", margin: 20, padding: 20, borderRadius: 20, elevation: 4 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1976d2", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  welcome: { fontSize: 14, color: "#555" },
  username: { fontSize: 18, fontWeight: "bold", marginTop: 2 },
  role: { fontSize: 12, color: "#1976d2", marginTop: 2, fontWeight: "600" },
  statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, borderTopColor: "#d32f2f", elevation: 3 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#d32f2f" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 2, textAlign: "center" },
  revenueCard: { backgroundColor: "#1976d2", borderRadius: 16, marginHorizontal: 20, padding: 18, alignItems: "center", marginBottom: 10, elevation: 4 },
  revenueLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  revenueValue: { fontSize: 28, fontWeight: "700", color: "#fff", marginTop: 4 },
  section: { fontSize: 18, fontWeight: "bold", marginHorizontal: 20, marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginHorizontal: 20, marginTop: 15 },
  actionCard: { width: width * 0.42, backgroundColor: "#fff", padding: 22, borderRadius: 18, marginBottom: 16, borderTopWidth: 4, elevation: 5 },
  actionTitle: { marginTop: 10, fontWeight: "bold" },
});