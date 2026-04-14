import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function Rules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/traffic-rules`)
      .then((res) => setRules(res.data))
      .catch(() => console.log("Failed to load rules"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Traffic Rules</Text>
        <Text style={s.headerSub}>Know the rules, stay safe</Text>
      </View>
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.icon}>{item.icon}</Text>
              <View style={s.cardInfo}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.fine}>Fine: ₹{item.fine}</Text>
              </View>
            </View>
            <Text style={s.desc}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#1976d2", padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: "#e0e0e0" },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#111" },
  fine: { fontSize: 12, color: "#d32f2f", fontWeight: "600", marginTop: 2 },
  desc: { fontSize: 13, color: "#555", lineHeight: 20 },
});