import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

const VIOLATION_TYPES = [
  { label: "Signal jumping", fine: 1000 },
  { label: "Speeding", fine: 2000 },
  { label: "No helmet", fine: 500 },
  { label: "Triple riding", fine: 1000 },
  { label: "No seatbelt", fine: 500 },
  { label: "Wrong side driving", fine: 5000 },
  { label: "Drunk driving", fine: 10000 },
  { label: "No parking", fine: 500 },
];

export default function OcrReportDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [officerName, setOfficerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    AsyncStorage.getItem("role").then((r) => {
      if (r) setUserRole(r);
    });
  }, []);

  useEffect(() => { fetchReport(); }, [id]);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/ocr-reports`);
      const found = res.data.find((r: any) => r._id === id);
      if (found) {
        setReport(found);
        const firstLine = found.extractedText?.split("\n")[0]?.trim();
        if (firstLine) setVehicleNumber(firstLine);
      }
    } catch {
      Alert.alert("Error", "Could not load report.");
    } finally {
      setLoading(false);
    }
  };
   
  const handleIssueChallan = async () => {
    if (!vehicleNumber || !selectedViolation || !officerName) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${BASE_URL}/challan`, {
        ocrReportId: id,
        vehicleNumber: vehicleNumber.toUpperCase(),
        violationType: selectedViolation.label,
        fineAmount: selectedViolation.fine,
        location: report?.address,
        officerName,
        ownerPhone,
      });
      setModalVisible(false);
      Alert.alert(
        "Challan Issued Successfully ✅",
        `Vehicle: ${vehicleNumber.toUpperCase()}\nViolation: ${selectedViolation.label}\nFine: ₹${selectedViolation.fine}\nLocation: ${report?.address || "Unknown"}\nOfficer: ${officerName}${ownerPhone ? `\nSMS sent to: ${ownerPhone}` : ""}`,
        [
          {
            text: "View Admin Dashboard",
            onPress: () => router.push("/(tabs)/AdminDashboard" as any),
          },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch {
      Alert.alert("Failed", "Could not issue challan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666" }}>Report not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: `${BASE_URL}/${report.fileUrl}` }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>OCR confidence</Text>
          <View style={[styles.badge, { backgroundColor: report.confidence >= 75 ? "#4caf50" : "#ff9800" }]}>
            <Text style={styles.badgeText}>{report.confidence}%</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Extracted text</Text>
        <View style={styles.textBox}>
          <Text style={styles.extractedText}>{report.extractedText || "No text detected"}</Text>
        </View>

        <Text style={styles.sectionLabel}>Location</Text>
        <Text style={styles.value}>📍 {report.address || "Unknown"}</Text>
        <Text style={styles.subValue}>
          {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
        </Text>

        <Text style={styles.sectionLabel}>Reported on</Text>
        <Text style={styles.value}>{new Date(report.createdAt).toLocaleString()}</Text>

        {userRole === "admin" ? (
          <TouchableOpacity style={styles.challanButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.challanButtonText}>Issue Challan</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userInfoBox}>
            <Text style={styles.userInfoText}>
              Only admins can issue challans. Report submitted successfully.
            </Text>
          </View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Issue Challan</Text>

            <Text style={styles.fieldLabel}>Vehicle number</Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              placeholder="MH 12 AB 3456"
            />

            <Text style={styles.fieldLabel}>Officer name</Text>
            <TextInput
              style={styles.input}
              value={officerName}
              onChangeText={setOfficerName}
              placeholder="Insp. Sharma"
            />

            <Text style={styles.fieldLabel}>Owner phone number</Text>
            <TextInput
              style={styles.input}
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              placeholder="10 digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.fieldLabel}>Violation type</Text>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {VIOLATION_TYPES.map((v) => (
                <TouchableOpacity
                  key={v.label}
                  style={[
                    styles.violationItem,
                    selectedViolation?.label === v.label && styles.violationSelected,
                  ]}
                  onPress={() => setSelectedViolation(v)}
                >
                  <Text style={[
                    styles.violationLabel,
                    selectedViolation?.label === v.label && { color: "#1976d2" },
                  ]}>
                    {v.label}
                  </Text>
                  <Text style={styles.violationFine}>₹{v.fine}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedViolation && (
              <View style={styles.finePreview}>
                <Text style={styles.finePreviewText}>
                  Fine amount: ₹{selectedViolation.fine}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.issueButton} onPress={handleIssueChallan}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.issueText}>Confirm & Issue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 220 },
  body: { padding: 20 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  label: { fontSize: 14, color: "#666", flex: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  textBox: { backgroundColor: "#f4f4f8", borderRadius: 10, padding: 12, marginBottom: 4 },
  extractedText: { fontSize: 18, fontWeight: "700", color: "#111", fontFamily: "monospace", letterSpacing: 1 },
  value: { fontSize: 14, color: "#333", marginBottom: 2 },
  subValue: { fontSize: 12, color: "#aaa", marginBottom: 4 },
  challanButton: { backgroundColor: "#d32f2f", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 28 },
  challanButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  userInfoBox: { backgroundColor: "#e8f5e9", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 28 },
  userInfoText: { color: "#2e7d32", fontSize: 14, textAlign: "center", fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#111" },
  fieldLabel: { fontSize: 12, color: "#888", marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 0.5, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 14, color: "#111" },
  violationItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4, backgroundColor: "#f5f5f5" },
  violationSelected: { backgroundColor: "#e3f0fb", borderWidth: 1, borderColor: "#1976d2" },
  violationLabel: { fontSize: 14, color: "#333" },
  violationFine: { fontSize: 14, fontWeight: "600", color: "#d32f2f" },
  finePreview: { backgroundColor: "#fff8e1", padding: 10, borderRadius: 8, marginTop: 8 },
  finePreviewText: { color: "#f57c00", fontWeight: "700", fontSize: 14, textAlign: "center" },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  cancelText: { color: "#666", fontWeight: "600" },
  issueButton: { flex: 2, backgroundColor: "#d32f2f", padding: 14, borderRadius: 10, alignItems: "center" },
  issueText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});