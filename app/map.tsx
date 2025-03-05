import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import MapView, { Polyline, Marker } from "react-native-maps";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const travelModes = ["driving", "walking", "bicycling", "transit"];
const polyline = require("@mapbox/polyline");

export default function MapScreen() {
  const { bestLatitude, bestLongitude, participants } = useLocalSearchParams();
  const [routes, setRoutes] = useState([]);
  const [selectedMode, setSelectedMode] = useState("driving");
  const [travelTimes, setTravelTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [parsedParticipants, setParsedParticipants] = useState([]);
  const router = useRouter();

  // ✅ Ensure participants is a string before parsing
  useEffect(() => {
    if (typeof participants === "string") {
      try {
        const parsed = JSON.parse(participants);
        if (Array.isArray(parsed)) {
          setParsedParticipants(
            parsed.filter((p) => p.latitude !== null && p.longitude !== null),
          );
        } else {
          console.error("Participants is not an array.");
          setParsedParticipants([]);
        }
      } catch (error) {
        console.error("Invalid JSON for participants:", error);
        Alert.alert("Error", "Invalid participant data.");
        setParsedParticipants([]);
      }
    } else {
      console.error("Participants is not a string:", participants);
      setParsedParticipants([]);
    }
  }, [participants]);

  useEffect(() => {
    if (bestLatitude && bestLongitude && parsedParticipants.length > 0) {
      fetchRoutes(parsedParticipants);
    } else {
      setLoading(false);
    }
  }, [bestLatitude, bestLongitude, parsedParticipants]);

  // Fetch multiple routes (each participant to best location)
  async function fetchRoutes(participants) {
    let fetchedRoutes = [];
    for (const participant of participants) {
      if (participant.latitude && participant.longitude) {
        const route = await fetchRoute(
          participant.latitude,
          participant.longitude,
          bestLatitude,
          bestLongitude,
          "driving",
        );
        if (route.length > 0) {
          fetchedRoutes.push(route);
        }
      }
    }
    setRoutes(fetchedRoutes);
    setLoading(false);
  }

  // Fetch a single route (from participant to best locateeion)
  async function fetchRoute(startLat, startLng, endLat, endLng, mode) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${startLat},${startLng}`,
            destination: `${endLat},${endLng}`,
            key: GOOGLE_MAPS_API_KEY,
            mode: mode,
          },
        },
      );

      if (response.data.routes.length > 0) {
        const points = response.data.routes[0].overview_polyline.points;
        return decodePolyline(points);
      }
    } catch (error) {
      console.error(`Error fetching route for ${mode}:`, error);
    }
    return [];
  }

  // Decode Polyline to Coordinates
  function decodePolyline(encoded) {
    let points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ED8F03" />
        <Text className="mt-4 text-gray-700">Loading Routes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Map View */}
      <MapView
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude: bestLatitude,
          longitude: bestLongitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Best Location Marker */}
        <Marker
          coordinate={{ latitude: bestLatitude, longitude: bestLongitude }}
          title="Best Location"
          pinColor="red"
        />

        {/* Participant Markers */}
        {parsedParticipants.map((participant, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: participant.latitude,
              longitude: participant.longitude,
            }}
            title={participant.full_name}
            pinColor="blue"
          />
        ))}

        {/* Draw Multiple Routes */}
        {routes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route}
            strokeWidth={4}
            strokeColor="blue"
          />
        ))}
      </MapView>

      {/* Back Button */}
      <View className="absolute top-2r left-5">
        <TouchableOpacity
          className="bg-orange-700 px-4 py-3 top-20 rounded-lg shadow-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
