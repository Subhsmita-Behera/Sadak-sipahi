import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000";

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState("user");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!mobile || !password) {
      Alert.alert("Error", "Enter mobile and password");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/login`, {
        phone: mobile,
        password: password,
      });

      const { token, user } = response.data;

      if (user.role !== role) {
        Alert.alert("Wrong Role", `This is a ${user.role} account. Please select correct role.`);
        return;
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("role", user.role);
      await AsyncStorage.setItem("userName", user.name);

      if (user.role === "admin") {
       router.replace("/(tabs)/AdminHome" as any);
      } else {
       router.replace("/(tabs)/index" as any);
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.logo}>🚦</Text>
        <Text style={s.title}>Sadak Sipahi</Text>
        <Text style={s.sub}>Citizen Traffic Safety App</Text>

        <View style={s.roleRow}>
          <TouchableOpacity
            style={[s.roleBtn, role === "user" && s.roleActive]}
            onPress={() => setRole("user")}
          >
            <Text style={s.roleEmoji}>👤</Text>
            <Text style={[s.roleLabel, role === "user" && s.roleLabelActive]}>User</Text>
            <Text style={s.roleHint}>Report violations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.roleBtn, role === "admin" && s.roleActive]}
            onPress={() => setRole("admin")}
          >
            <Text style={s.roleEmoji}>🛡️</Text>
            <Text style={[s.roleLabel, role === "admin" && s.roleLabelActive]}>Admin</Text>
            <Text style={s.roleHint}>Issue challans</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={s.input}
          placeholder="Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.btn} onPress={login} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Login as {role === "admin" ? "Admin" : "User"}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register" as any)}>
          <Text style={s.regLink}>Don't have an account? Register</Text>
        </TouchableOpacity>

        <Text style={s.footer}>© 2025 Sadak Sipahi</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e3c72", justifyContent: "center", alignItems: "center" },
  card: { width: "90%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#1e3c72" },
  sub: { fontSize: 13, color: "#888", marginBottom: 20 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 20, width: "100%" },
  roleBtn: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", backgroundColor: "#f9f9f9" },
  roleActive: { borderColor: "#1976d2", backgroundColor: "#e8f0fe" },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 14, fontWeight: "700", color: "#444" },
  roleLabelActive: { color: "#1976d2" },
  roleHint: { fontSize: 10, color: "#aaa", marginTop: 2 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 13, marginBottom: 12, fontSize: 15, color: "#111", backgroundColor: "#fafafa" },
  btn: { width: "100%", backgroundColor: "#1976d2", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  regLink: { color: "#1976d2", marginTop: 16, fontSize: 14 },
  footer: { color: "#bbb", marginTop: 20, fontSize: 11 },
});