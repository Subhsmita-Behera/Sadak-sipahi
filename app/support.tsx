import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function Support() {
  const [support, setSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/support`)
      .then((res) => setSupport(res.data))
      .catch(() => console.log("Failed to load support"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Help & Support</Text>
        <Text style={s.headerSub}>We are here to help you</Text>
      </View>

      <View style={s.body}>
        <View style={s.emergencyCard}>
          <Text style={s.emergencyTitle}>Emergency</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${support?.emergencyPhone}`)}>
            <Text style={s.emergencyNumber}>{support?.emergencyPhone}</Text>
          </TouchableOpacity>
          <Text style={s.emergencySub}>Traffic Police Emergency</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Contact Us</Text>
          <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`tel:${support?.phone}`)}>
            <Text style={s.contactIcon}>📞</Text>
            <View>
              <Text style={s.contactLabel}>Helpline</Text>
              <Text style={s.contactValue}>{support?.phone}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`mailto:${support?.email}`)}>
            <Text style={s.contactIcon}>📧</Text>
            <View>
              <Text style={s.contactLabel}>Email</Text>
              <Text style={s.contactValue}>{support?.email}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`https://wa.me/${support?.whatsapp}`)}>
            <Text style={s.contactIcon}>💬</Text>
            <View>
              <Text style={s.contactLabel}>WhatsApp</Text>
              <Text style={s.contactValue}>{support?.whatsapp}</Text>
            </View>
          </TouchableOpacity>
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>🏢</Text>
            <View>
              <Text style={s.contactLabel}>Address</Text>
              <Text style={s.contactValue}>{support?.address}</Text>
            </View>
          </View>
          <View style={s.contactRow}>
            <Text style={s.contactIcon}>⏰</Text>
            <View>
              <Text style={s.contactLabel}>Working hours</Text>
              <Text style={s.contactValue}>{support?.timings}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#1976d2", padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  body: { padding: 16 },
  emergencyCard: { backgroundColor: "#d32f2f", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 16 },
  emergencyTitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  emergencyNumber: { fontSize: 36, fontWeight: "700", color: "#fff" },
  emergencySub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#e0e0e0" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderColor: "#f0f0f0", gap: 12 },
  contactIcon: { fontSize: 24 },
  contactLabel: { fontSize: 12, color: "#888" },
  contactValue: { fontSize: 14, fontWeight: "600", color: "#1976d2", marginTop: 2 },
});