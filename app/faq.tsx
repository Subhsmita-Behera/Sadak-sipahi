import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function FAQ() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    axios.get(`${BASE_URL}/faq`)
      .then((res) => setFaqs(res.data))
      .catch(() => console.log("Failed to load FAQs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>FAQ</Text>
        <Text style={s.headerSub}>Frequently Asked Questions</Text>
      </View>
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => setExpanded(expanded === item.id ? null : item.id)}
          >
            <View style={s.qRow}>
              <Text style={s.q}>{item.question}</Text>
              <Text style={s.arrow}>{expanded === item.id ? "▲" : "▼"}</Text>
            </View>
            {expanded === item.id && (
              <Text style={s.answer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
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
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#e0e0e0" },
  qRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  q: { fontSize: 14, fontWeight: "600", color: "#111", flex: 1, paddingRight: 8 },
  arrow: { fontSize: 12, color: "#1976d2" },
  answer: { fontSize: 13, color: "#555", marginTop: 10, lineHeight: 20, borderTopWidth: 0.5, borderColor: "#eee", paddingTop: 10 },
});