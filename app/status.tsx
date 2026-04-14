import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function TrackStatus() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("token").then(async (token) => {
      try {
        const payload = JSON.parse(atob(token!.split(".")[1]));
        const user = await axios.get(`${BASE_URL}/admin/users`);
        const phone = user.data[0]?.phone;
        if (phone) {
          const res = await axios.get(`${BASE_URL}/track-status/${phone}`);
          setData(res.data);
        }
      } catch {
        console.log("Failed to load status");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;

  const statusColor = (s: string) =>
    s === "paid" ? "#4caf50" : s === "cancelled" ? "#9e9e9e" : "#ff9800";

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Track Status</Text>
        <Text style={s.headerSub}>Your reports and challans</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{data?.totalReports ?? 0}</Text>
          <Text style={s.statLabel}>Total reports</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{data?.totalChallans ?? 0}</Text>
          <Text style={s.statLabel}>Challans</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Recent Reports</Text>
      {data?.reports?.map((item: any) => (
        <View key={item._id} style={s.card}>
          <Text style={s.plateText}>{item.extractedText?.split("\n")[0] || "No text"}</Text>
          <Text style={s.meta}>📍 {item.address || "Unknown"}</Text>
          <Text style={s.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>SUBMITTED</Text>
          </View>
        </View>
      ))}

      <Text style={s.sectionTitle}>Recent Challans</Text>
      {data?.challans?.map((item: any) => (
        <View key={item._id} style={s.card}>
          <Text style={s.plateText}>{item.vehicleNumber}</Text>
          <Text style={s.meta}>{item.violationType} · ₹{item.fineAmount}</Text>
          <View style={[s.statusBadge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={s.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#1976d2", padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 12, padding: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 0.5, borderColor: "#e0e0e0" },
  statValue: { fontSize: 28, fontWeight: "700", color: "#1976d2" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10, borderWidth: 0.5, borderColor: "#e0e0e0" },
  plateText: { fontSize: 15, fontWeight: "700", color: "#111", fontFamily: "monospace" },
  meta: { fontSize: 12, color: "#666", marginTop: 4 },
  statusBadge: { backgroundColor: "#4caf50", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 8, alignSelf: "flex-start" },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});