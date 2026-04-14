import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapScreen() {
  const { latitude, longitude } = useLocalSearchParams();

  const lat = Number(latitude) || 20.2995;
  const lng = Number(longitude) || 85.8971;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title="Violation Location"
        />
      </MapView>
    </View>
  );
}