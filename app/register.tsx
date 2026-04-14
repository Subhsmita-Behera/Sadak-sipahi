import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!name || !phone || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (role === "admin" && !adminCode) {
      Alert.alert("Error", "Enter admin secret code");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/register`, {
        name,
        phone,
        email,
        password,
        role,
        adminCode,
      });
      Alert.alert("Success", "Registered successfully! Please login.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.card}>
        <Text style={s.logo}>🚦</Text>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.sub}>Join Sadak Sipahi</Text>

        <View style={s.roleRow}>
          <TouchableOpacity
            style={[s.roleBtn, role === "user" && s.roleActive]}
            onPress={() => setRole("user")}
          >
            <Text style={s.roleEmoji}>👤</Text>
            <Text style={[s.roleLabel, role === "user" && s.roleLabelActive]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.roleBtn, role === "admin" && s.roleActive]}
            onPress={() => setRole("admin")}
          >
            <Text style={s.roleEmoji}>🛡️</Text>
            <Text style={[s.roleLabel, role === "admin" && s.roleLabelActive]}>Admin</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="#999" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Phone Number" placeholderTextColor="#999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={s.input} placeholder="Confirm Password" placeholderTextColor="#999" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

        {role === "admin" && (
          <View style={s.adminCodeBox}>
            <Text style={s.adminCodeLabel}>🔐 Admin Secret Code</Text>
            <TextInput
              style={[s.input, { borderColor: "#d32f2f" }]}
              placeholder="Enter admin secret code"
              placeholderTextColor="#999"
              secureTextEntry
              value={adminCode}
              onChangeText={setAdminCode}
            />
            <Text style={s.adminCodeHint}>Contact your supervisor for the code</Text>
          </View>
        )}

        <TouchableOpacity style={s.btn} onPress={register} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Create {role === "admin" ? "Admin" : "User"} Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={s.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#1e3c72", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  logo: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#1e3c72" },
  sub: { fontSize: 13, color: "#888", marginBottom: 16 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 16, width: "100%" },
  roleBtn: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", backgroundColor: "#f9f9f9" },
  roleActive: { borderColor: "#1976d2", backgroundColor: "#e8f0fe" },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 14, fontWeight: "700", color: "#444" },
  roleLabelActive: { color: "#1976d2" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 13, marginBottom: 12, fontSize: 15, color: "#111", backgroundColor: "#fafafa" },
  adminCodeBox: { width: "100%", backgroundColor: "#fff8f8", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffcdd2" },
  adminCodeLabel: { fontSize: 13, fontWeight: "700", color: "#d32f2f", marginBottom: 8 },
  adminCodeHint: { fontSize: 11, color: "#e57373", marginTop: 4 },
  btn: { width: "100%", backgroundColor: "#1976d2", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginLink: { color: "#1976d2", marginTop: 16, fontSize: 14 },
});