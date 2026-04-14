import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function OcrReportsList() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/ocr-reports`);
      setReports(res.data);
    } catch {
      console.log("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.trim().length < 2) { fetchReports(); return; }
    try {
      setSearching(true);
      const res = await axios.get(`${BASE_URL}/ocr-reports/search?q=${text}`);
      setReports(res.data);
    } catch {
      console.log("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const getConfidenceColor = (conf: number) =>
    conf >= 75 ? "#4caf50" : conf >= 50 ? "#ff9800" : "#f44336";

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({
        pathname: "/(tabs)/OcrReportDetail" as any,
        params: { id: item._id }
      })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.plateText} numberOfLines={1}>
          {item.extractedText?.split("\n")[0] || "No text detected"}
        </Text>
        <View style={[styles.confBadge, { backgroundColor: getConfidenceColor(item.confidence) }]}>
          <Text style={styles.confText}>{item.confidence}%</Text>
        </View>
      </View>
      <Text style={styles.addressText} numberOfLines={1}>📍 {item.address || "Unknown"}</Text>
      <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by plate or text..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#aaa"
        />
        {searching && <ActivityIndicator size="small" color="#1976d2" style={{ marginLeft: 8 }} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reports found.</Text>
          }
          refreshing={loading}
          onRefresh={fetchReports}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "#ddd",
    color: "#111",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  plateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    flex: 1,
    fontFamily: "monospace",
  },
  confBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 8,
  },
  confText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addressText: { fontSize: 12, color: "#666", marginBottom: 4 },
  dateText: { fontSize: 11, color: "#aaa" },
  emptyText: { textAlign: "center", color: "#aaa", marginTop: 40 },
});