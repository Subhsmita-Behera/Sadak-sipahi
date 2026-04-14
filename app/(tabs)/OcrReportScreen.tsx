import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = "http://192.168.1.2:5000"; // ← your IP

export default function OcrReportScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<string>("");

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OCR result state
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /* ================= LOCATION ================= */

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is required.");
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      const geo = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      if (geo.length > 0) {
        const g = geo[0];
        setAddress(
          `${g.street || ""}, ${g.district || g.city || ""}, ${g.region || ""}`
        );
      }
    })();
  }, []);

  /* ================= CAPTURE PHOTO ================= */

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,        // max quality — do NOT compress in app
        skipProcessing: false,
      });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setExtractedText(null);
        setConfidence(null);
        setSubmitted(false);
      }
    } catch {
      Alert.alert("Error", "Photo capture failed.");
    }
  };

  /* ================= PICK FROM GALLERY ================= */

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Gallery permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false, // don't distort the plate
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setExtractedText(null);
      setConfidence(null);
      setSubmitted(false);
    }
  };

  /* ================= RESET ================= */

  const handleReset = () => {
    setImageUri(null);
    setExtractedText(null);
    setConfidence(null);
    setSubmitted(false);
  };

  /* ================= SEND FOR OCR ================= */

  const handleSendOcr = async () => {
    if (!imageUri || !location) {
      Alert.alert("Missing Data", "Capture an image first.");
      return;
    }
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "ocr_report.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());
      formData.append("address", address);

      const response = await axios.post(`${BASE_URL}/ocr-report`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const { extractedText: text, confidence: conf } = response.data;

      // No plate detected at all
      if (!text || text === "No plate detected") {
        Alert.alert(
          "No Plate Found",
          "Could not detect a number plate.\n\nTips:\n• Hold camera steady\n• Ensure good lighting\n• Get closer to the plate\n• Avoid glare/shadows",
          [
            { text: "Retake", onPress: handleReset },
            { text: "OK" },
          ]
        );
        return;
      }

      // Plate detected but low confidence — warn but allow use
      if (conf < 40) {
        Alert.alert(
          "Low Confidence ⚠️",
          `Detected: ${text}\nConfidence: ${conf}%\n\nThe result may be inaccurate.`,
          [
            { text: "Retake", onPress: handleReset },
            {
              text: "Use Anyway",
              onPress: () => {
                setExtractedText(text);
                setConfidence(conf);
                setSubmitted(true);
              },
            },
          ]
        );
        return;
      }

      // Good result
      setExtractedText(text);
      setConfidence(conf);
      setSubmitted(true);

    } catch (error: any) {
      console.log("OCR Error:", error);

      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Timeout ⏱️",
          "Server took too long to respond.\n\nCheck your connection and try again."
        );
      } else if (error.message === "Network Error") {
        Alert.alert(
          "Network Error 📡",
          `Cannot reach server at ${BASE_URL}.\n\nMake sure:\n• Phone and PC are on same WiFi\n• Backend server is running\n• IP address is correct`
        );
      } else if (error.response?.status === 500) {
        Alert.alert(
          "Server Error 🛠️",
          "Something went wrong on the server. Check your backend logs."
        );
      } else if (error.response?.status === 400) {
        Alert.alert("Bad Request", "Image could not be processed. Try a different photo.");
      } else {
        Alert.alert(
          "OCR Failed ❌",
          `Error: ${error.message || "Unknown error"}. Try again with a clearer image.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= PERMISSIONS ================= */

  if (!cameraPermission) return <View style={styles.center} />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= RESULT SCREEN ================= */

  if (submitted && extractedText !== null) {
    return (
      <ScrollView
        style={styles.resultContainer}
        contentContainerStyle={{ padding: 24 }}
      >
        <Text style={styles.resultTitle}>OCR Result ✅</Text>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.confidenceRow}>
          <Text style={styles.label}>Confidence:</Text>
          <View
            style={[
              styles.confidenceBadge,
              {
                backgroundColor:
                  confidence && confidence > 70 ? "#4caf50" : "#ff9800",
              },
            ]}
          >
            <Text style={styles.badgeText}>{confidence}%</Text>
          </View>
        </View>

        <Text style={styles.label}>Extracted Text:</Text>
        <View style={styles.textBox}>
          <Text style={styles.extractedText}>
            {extractedText.length > 0
              ? extractedText
              : "No text detected in this image."}
          </Text>
        </View>

        <Text style={styles.locationText}>📍 {address}</Text>

        <View style={styles.resultButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.buttonText}>NEW SCAN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: "/map" as any,
                params: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
              })
            }
          >
            <Text style={styles.buttonText}>VIEW MAP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  /* ================= PREVIEW SCREEN ================= */

  if (imageUri) {
    return (
      <View style={{ flex: 1 }}>
        <Image
          source={{ uri: imageUri }}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
        <View style={styles.previewButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.buttonText}>RETAKE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleSendOcr}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  SCANNING...
                </Text>
              </>
            ) : (
              <Text style={styles.buttonText}>RUN OCR</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ================= CAMERA SCREEN ================= */

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        mode="picture"
      />

      {/* Overlay hint */}
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          Point at a number plate — ensure good lighting
        </Text>
      </View>

      {/* Plate guide frame */}
      <View style={styles.plateFrame} />

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
          <Text style={styles.buttonText}>GALLERY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapturePhoto}
        >
          <Text style={styles.buttonText}>CAPTURE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  hintBox: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: {
    color: "#fff",
    fontSize: 13,
  },
  // guide frame to help user align the plate
  plateFrame: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
    width: "80%",
    height: 90,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  captureButton: {
    backgroundColor: "#ff1744",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 15,
  },
  galleryButton: {
    backgroundColor: "#555",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 15,
  },
  primaryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#555",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  permissionText: {
    marginBottom: 15,
    fontSize: 15,
  },
  previewButtons: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignSelf: "center",
    gap: 16,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  textBox: {
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    minHeight: 80,
  },
  extractedText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
    fontFamily: "monospace",
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 24,
  },
  resultButtons: {
    flexDirection: "row",
    gap: 12,
  },
});