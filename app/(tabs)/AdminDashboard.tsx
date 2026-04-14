import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "reports" | "challans" | "users" | "vehicles">("overview");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  const [challanModal, setChallanModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [vehicleModal, setVehicleModal] = useState(false);
  const [vNumber, setVNumber] = useState("");
  const [vOwnerName, setVOwnerName] = useState("");
  const [vOwnerPhone, setVOwnerPhone] = useState("");
  const [vOwnerEmail, setVOwnerEmail] = useState("");
  const [vType, setVType] = useState("bike");
  const [vAddress, setVAddress] = useState("");
  const [vSubmitting, setVSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("userName").then((n) => { if (n) setAdminName(n); });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, challansRes, usersRes, vehiclesRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/stats`),
        axios.get(`${BASE_URL}/ocr-reports`),
        axios.get(`${BASE_URL}/challans`),
        axios.get(`${BASE_URL}/admin/users`),
        axios.get(`${BASE_URL}/vehicles`),
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setChallans(challansRes.data);
      setUsers(usersRes.data);
      setVehicles(vehiclesRes.data);
    } catch {
      console.log("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateChallanStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${BASE_URL}/challan/${id}/status`, { status });
      Alert.alert("Updated ✅", `Challan marked as ${status}`);
      fetchAll();
    } catch {
      Alert.alert("Failed", "Could not update status");
    }
  };

  const deleteReport = async (id: string) => {
    Alert.alert("Delete Report", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await axios.delete(`${BASE_URL}/ocr-report/${id}`); fetchAll(); }
        catch { Alert.alert("Failed", "Could not delete report"); }
      }},
    ]);
  };

  const deleteChallan = async (id: string) => {
    Alert.alert("Delete Challan", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await axios.delete(`${BASE_URL}/challan/${id}`); fetchAll(); }
        catch { Alert.alert("Failed", "Could not delete challan"); }
      }},
    ]);
  };

  const deleteVehicle = async (id: string) => {
    Alert.alert("Delete Vehicle", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await axios.delete(`${BASE_URL}/vehicle/${id}`); fetchAll(); }
        catch { Alert.alert("Failed", "Could not delete vehicle"); }
      }},
    ]);
  };

  const openChallanModal = async (report: any) => {
    setSelectedReport(report);
    const plate = report.extractedText?.split("\n")[0]?.trim() || "";
    setVehicleNumber(plate);
    setSelectedViolation(null);
    setOfficerName(adminName);
    setOwnerPhone("");

    // Auto lookup owner
    try {
      const res = await axios.get(`${BASE_URL}/vehicle/${plate}`);
      if (res.data) {
        setOwnerPhone(res.data.ownerPhone);
        Alert.alert("Owner Found ✅", `${res.data.ownerName}\n${res.data.ownerPhone}`);
      }
    } catch { }
    setChallanModal(true);
  };

  const handleIssueChallan = async () => {
    if (!vehicleNumber || !selectedViolation || !officerName) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }
    try {
      setSubmitting(true);
      const response = await axios.post(`${BASE_URL}/challan`, {
        ocrReportId: selectedReport._id,
        vehicleNumber: vehicleNumber.toUpperCase(),
        violationType: selectedViolation.label,
        fineAmount: selectedViolation.fine,
        location: selectedReport?.address,
        officerName,
        ownerPhone,
      });
      setChallanModal(false);
      const smsSent = response.data.smsSent;
      Alert.alert(
        "Challan Issued ✅",
        `Vehicle: ${vehicleNumber.toUpperCase()}\nViolation: ${selectedViolation.label}\nFine: ₹${selectedViolation.fine}\n${smsSent ? "✅ SMS sent to owner" : "⚠️ SMS not sent"}`,
        [{ text: "OK", onPress: () => { setTab("challans"); fetchAll(); } }]
      );
    } catch {
      Alert.alert("Failed", "Could not issue challan.");
    } finally {
      setSubmitting(false);
    }
  };

  const registerVehicle = async () => {
    if (!vNumber || !vOwnerName || !vOwnerPhone) {
      Alert.alert("Missing fields", "Vehicle number, owner name and phone required.");
      return;
    }
    try {
      setVSubmitting(true);
      await axios.post(`${BASE_URL}/vehicle`, {
        vehicleNumber: vNumber.toUpperCase(),
        ownerName: vOwnerName,
        ownerPhone: vOwnerPhone,
        ownerEmail: vOwnerEmail,
        vehicleType: vType,
        address: vAddress,
      });
      Alert.alert("Success ✅", `Vehicle ${vNumber.toUpperCase()} registered!`);
      setVehicleModal(false);
      setVNumber(""); setVOwnerName(""); setVOwnerPhone(""); setVOwnerEmail(""); setVAddress("");
      fetchAll();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to register vehicle");
    } finally {
      setVSubmitting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        await AsyncStorage.clear();
        router.replace("/login" as any);
      }},
    ]);
  };

  const statusColor = (s: string) =>
    s === "paid" ? "#4caf50" : s === "cancelled" ? "#9e9e9e" : "#ff9800";

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 80 }} size="large" color="#1976d2" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Welcome, {adminName || "Admin"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {(["overview", "reports", "challans", "users", "vehicles"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === "overview" && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalOcr ?? 0}</Text>
              <Text style={styles.statLabel}>Total scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Challans issued</Text>
            </View>
            <View style={[styles.statCard, { borderColor: "#ff9800" }]}>
              <Text style={[styles.statValue, { color: "#ff9800" }]}>{stats?.pendingChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { borderColor: "#4caf50" }]}>
              <Text style={[styles.statValue, { color: "#4caf50" }]}>{stats?.paidChallans ?? 0}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total revenue collected</Text>
            <Text style={styles.revenueValue}>₹{(stats?.totalRevenue ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => setTab("reports")}>
              <Text style={styles.quickBtnIcon}>📋</Text>
              <Text style={styles.quickBtnText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => setTab("challans")}>
              <Text style={styles.quickBtnIcon}>📝</Text>
              <Text style={styles.quickBtnText}>Challans</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => setTab("vehicles")}>
              <Text style={styles.quickBtnIcon}>🚗</Text>
              <Text style={styles.quickBtnText}>Vehicles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(tabs)/map" as any)}>
              <Text style={styles.quickBtnIcon}>🗺️</Text>
              <Text style={styles.quickBtnText}>Map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {tab === "reports" && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={fetchAll}
          renderItem={({ item }) => (
            <View style={styles.reportCard}>
              <View style={styles.reportTop}>
                <Text style={styles.plateText}>{item.extractedText?.split("\n")[0] || "No text"}</Text>
                <View style={[styles.confBadge, { backgroundColor: item.confidence >= 75 ? "#4caf50" : "#ff9800" }]}>
                  <Text style={styles.confText}>{item.confidence}%</Text>
                </View>
              </View>
              <Text style={styles.reportMeta}>📍 {item.address || "Unknown"}</Text>
              <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.challanBtn} onPress={() => openChallanModal(item)}>
                  <Text style={styles.challanBtnText}>Issue Challan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteReport(item._id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No reports yet.</Text>}
        />
      )}

      {tab === "challans" && (
        <FlatList
          data={challans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={fetchAll}
          renderItem={({ item }) => (
            <View style={styles.challanCard}>
              <View style={styles.challanTop}>
                <Text style={styles.vehicleNo}>{item.vehicleNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.violation}>{item.violationType}</Text>
              <Text style={styles.fine}>₹{item.fineAmount}</Text>
              <Text style={styles.challanMeta}>👮 {item.officerName || "Unknown"} · {new Date(item.issuedAt).toLocaleDateString()}</Text>
              <Text style={styles.challanMeta}>📍 {item.ocrReportId?.address || "Unknown"}</Text>
              {item.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.paidBtn} onPress={() => updateChallanStatus(item._id, "paid")}>
                    <Text style={styles.paidBtnText}>Mark paid</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => updateChallanStatus(item._id, "cancelled")}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteChallan(item._id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No challans yet.</Text>}
        />
      )}

      {tab === "users" && (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={loading}
          onRefresh={fetchAll}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userPhone}>{item.phone}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: item.role === "admin" ? "#1976d2" : "#4caf50" }]}>
                <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No users yet.</Text>}
        />
      )}

      {tab === "vehicles" && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.challanBtn, { margin: 16, padding: 14 }]}
            onPress={() => setVehicleModal(true)}
          >
            <Text style={styles.challanBtnText}>+ Register New Vehicle</Text>
          </TouchableOpacity>
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            refreshing={loading}
            onRefresh={fetchAll}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={[styles.userAvatar, { backgroundColor: "#ff9800" }]}>
                  <Text style={styles.userAvatarText}>🚗</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.vehicleNumber}</Text>
                  <Text style={styles.userPhone}>{item.ownerName} · {item.ownerPhone}</Text>
                  <Text style={styles.userEmail}>{item.vehicleType} · {item.address || "No address"}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteVehicle(item._id)}>
                  <Text style={{ color: "#d32f2f", fontWeight: "700", fontSize: 24 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { paddingHorizontal: 16 }]}>
                No vehicles registered yet.{"\n"}Add vehicles so challans auto-fill owner details and send SMS automatically.
              </Text>
            }
          />
        </View>
      )}

      {/* CHALLAN MODAL */}
      <Modal visible={challanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Issue Challan</Text>
            {selectedReport && (
              <View style={styles.reportPreview}>
                <Text style={styles.reportPreviewPlate}>{selectedReport.extractedText?.split("\n")[0]}</Text>
                <Text style={styles.reportPreviewAddr}>📍 {selectedReport.address}</Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Vehicle number</Text>
            <TextInput style={styles.input} value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" placeholder="OD 05 AJ 4778" />
            <Text style={styles.fieldLabel}>Officer name</Text>
            <TextInput style={styles.input} value={officerName} onChangeText={setOfficerName} placeholder="Insp. Sharma" />
            <Text style={styles.fieldLabel}>Owner phone (auto-filled if vehicle registered)</Text>
            <TextInput style={styles.input} value={ownerPhone} onChangeText={setOwnerPhone} placeholder="10 digit number" keyboardType="phone-pad" maxLength={10} />
            <Text style={styles.fieldLabel}>Violation type</Text>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {VIOLATION_TYPES.map((v) => (
                <TouchableOpacity
                  key={v.label}
                  style={[styles.violationItem, selectedViolation?.label === v.label && styles.violationSelected]}
                  onPress={() => setSelectedViolation(v)}
                >
                  <Text style={[styles.violationLabel, selectedViolation?.label === v.label && { color: "#1976d2" }]}>{v.label}</Text>
                  <Text style={styles.violationFine}>₹{v.fine}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedViolation && (
              <View style={styles.finePreview}>
                <Text style={styles.finePreviewText}>Fine: ₹{selectedViolation.fine}</Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setChallanModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.issueButton} onPress={handleIssueChallan}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.issueText}>Confirm & Issue</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VEHICLE MODAL */}
      <Modal visible={vehicleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register Vehicle</Text>
            <Text style={styles.fieldLabel}>Vehicle number</Text>
            <TextInput style={styles.input} value={vNumber} onChangeText={setVNumber} autoCapitalize="characters" placeholder="OD05AJ4778" />
            <Text style={styles.fieldLabel}>Owner name</Text>
            <TextInput style={styles.input} value={vOwnerName} onChangeText={setVOwnerName} placeholder="Ramesh Kumar" />
            <Text style={styles.fieldLabel}>Owner phone</Text>
            <TextInput style={styles.input} value={vOwnerPhone} onChangeText={setVOwnerPhone} keyboardType="phone-pad" maxLength={10} placeholder="10 digit number" />
            <Text style={styles.fieldLabel}>Owner email (optional)</Text>
            <TextInput style={styles.input} value={vOwnerEmail} onChangeText={setVOwnerEmail} keyboardType="email-address" placeholder="owner@email.com" />
            <Text style={styles.fieldLabel}>Address (optional)</Text>
            <TextInput style={styles.input} value={vAddress} onChangeText={setVAddress} placeholder="Owner address" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setVehicleModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.issueButton} onPress={registerVehicle}>
                {vSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.issueText}>Register</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "#1976d2", padding: 20, paddingTop: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  tabScroll: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderColor: "#ddd", flexGrow: 0 },
  tab: { paddingHorizontal: 20, paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#1976d2" },
  tabText: { fontSize: 14, color: "#aaa", fontWeight: "600" },
  activeTabText: { color: "#1976d2" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, minWidth: "44%", backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: "#e0e0e0" },
  statValue: { fontSize: 28, fontWeight: "700", color: "#1976d2" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  revenueCard: { backgroundColor: "#1976d2", borderRadius: 14, padding: 20, marginBottom: 14, alignItems: "center" },
  revenueLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 6 },
  revenueValue: { fontSize: 32, fontWeight: "700", color: "#fff" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: { flex: 1, minWidth: "44%", backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 0.5, borderColor: "#e0e0e0" },
  quickBtnIcon: { fontSize: 24, marginBottom: 6 },
  quickBtnText: { fontSize: 13, color: "#333", fontWeight: "600" },
  reportCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: "#e0e0e0" },
  reportTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  plateText: { fontSize: 16, fontWeight: "700", color: "#111", fontFamily: "monospace", flex: 1 },
  confBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginLeft: 8 },
  confText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  reportMeta: { fontSize: 12, color: "#666", marginBottom: 2 },
  reportDate: { fontSize: 11, color: "#aaa", marginBottom: 10 },
  reportActions: { flexDirection: "row", gap: 8 },
  challanBtn: { flex: 2, backgroundColor: "#d32f2f", padding: 8, borderRadius: 8, alignItems: "center" },
  challanBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: "#f5f5f5", padding: 8, borderRadius: 8, alignItems: "center", borderWidth: 0.5, borderColor: "#ccc" },
  deleteBtnText: { color: "#d32f2f", fontWeight: "600", fontSize: 13 },
  challanCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: "#e0e0e0" },
  challanTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  vehicleNo: { fontSize: 16, fontWeight: "700", fontFamily: "monospace", color: "#111" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  violation: { fontSize: 13, color: "#555", marginBottom: 2 },
  fine: { fontSize: 15, fontWeight: "700", color: "#d32f2f", marginBottom: 4 },
  challanMeta: { fontSize: 11, color: "#aaa" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  paidBtn: { flex: 1, backgroundColor: "#4caf50", padding: 8, borderRadius: 8, alignItems: "center" },
  paidBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelBtn: { flex: 1, backgroundColor: "#f5f5f5", padding: 8, borderRadius: 8, alignItems: "center", borderWidth: 0.5, borderColor: "#ccc" },
  cancelBtnText: { color: "#666", fontWeight: "600", fontSize: 13 },
  userCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: "#e0e0e0", flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1976d2", alignItems: "center", justifyContent: "center" },
  userAvatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#111" },
  userPhone: { fontSize: 13, color: "#555" },
  userEmail: { fontSize: 12, color: "#aaa" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: { textAlign: "center", color: "#aaa", marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111" },
  reportPreview: { backgroundColor: "#f4f4f8", borderRadius: 10, padding: 10, marginBottom: 12 },
  reportPreviewPlate: { fontSize: 16, fontWeight: "700", color: "#111", fontFamily: "monospace" },
  reportPreviewAddr: { fontSize: 12, color: "#666", marginTop: 2 },
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