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
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const travelModes = ["driving", "walking", "bicycling", "transit"];
const routeColors = [
  "purple",
  "orange",
  "purple",
  "green",
  "pink",
  "blue",
  "yellow",
];
const polyline = require("@mapbox/polyline");

export default function MapScreen() {
  const { bestLatitude, bestLongitude, participants } = useLocalSearchParams();
  const [routes, setRoutes] = useState([]);
  const [selectedMode, setSelectedMode] = useState("driving");
  const [travelTimes, setTravelTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsedParticipants, setParsedParticipants] = useState([]);
  const [selectedUser, setSelectedUser] = useState("All");
  const [userTravelTimes, setUserTravelTimes] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [transitSteps, setTransitSteps] = useState([]);
  const router = useRouter();

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
        const decodedCoords = decodePolyline(points);
        setRouteCoords(decodedCoords);
        setSelectedMode(mode);

        if (mode === "transit") {
          const steps = response.data.routes[0].legs[0].steps.map((step) => ({
            instruction: step.html_instructions.replace(/<[^>]*>?/gm, ""),
            distance: step.distance.text,
            duration: step.duration.text,
            travelMode: step.travel_mode,
            transitDetails: step.transit_details
              ? {
                  line: step.transit_details.line.name,
                  vehicle: step.transit_details.line.vehicle.name,
                  departureStop: step.transit_details.departure_stop.name,
                  arrivalStop: step.transit_details.arrival_stop.name,
                  numStops: step.transit_details.num_stops,
                }
              : null,
          }));
          setTransitSteps(steps);
        } else {
          setTransitSteps([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching route for ${mode}:`, error);
    }
  }

  function decodePolyline(encoded) {
    let points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  }

  async function fetchUserTravelTimes(user) {
    const participant = parsedParticipants.find((p) => p.fullName === user);
    if (!participant) return;

    let times = [];
    for (const mode of travelModes) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json`,
          {
            params: {
              origin: `${participant.latitude},${participant.longitude}`,
              destination: `${bestLatitude},${bestLongitude}`,
              key: GOOGLE_MAPS_API_KEY,
              mode: mode,
            },
          },
        );

        if (response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const distanceInMiles = (
            route.legs[0].distance.value / 1609.34
          ).toFixed(2);
          times.push({
            mode,
            duration: route.legs[0].duration.text,
            distance: `${distanceInMiles} miles`,
          });
        } else {
          times.push({ mode, duration: "N/A", distance: "N/A" });
        }
      } catch (error) {
        console.warn(`Warning: No route found for ${mode}.`);
        times.push({ mode, duration: "N/A", distance: "N/A" });
      }
    }
    setUserTravelTimes(times);
  }

  useEffect(() => {
    if (selectedUser !== "All") {
      fetchUserTravelTimes(selectedUser);
    }
  }, [selectedUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED8F03" />
        <Text style={styles.loadingText}>Loading Routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dropdown Menu */}
      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={selectedUser}
          onValueChange={(itemValue) => setSelectedUser(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="All" value="All" />
          {parsedParticipants.map((participant, index) => (
            <Picker.Item
              key={index}
              label={participant.fullName}
              value={participant.fullName}
            />
          ))}
        </Picker>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: bestLatitude,
          longitude: bestLongitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker
          coordinate={{ latitude: bestLatitude, longitude: bestLongitude }}
          title="Best Location"
          pinColor="red"
        />

        {selectedUser === "All"
          ? parsedParticipants.map((participant, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: participant.latitude,
                  longitude: participant.longitude,
                }}
                title={participant.fullName}
                pinColor={routeColors[index % routeColors.length]}
              />
            ))
          : parsedParticipants
              .filter((p) => p.fullName === selectedUser)
              .map((participant, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: participant.latitude,
                    longitude: participant.longitude,
                  }}
                  title={participant.fullName}
                  pinColor="blue"
                />
              ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
      </MapView>

      {/* Travel Modes */}
      {selectedUser !== "All" && (
        <View style={styles.travelTimesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userTravelTimes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.travelTimeCard,
                  selectedMode === item.mode ? styles.selectedCard : null,
                ]}
                onPress={() =>
                  fetchRoute(
                    parsedParticipants.find((p) => p.fullName === selectedUser)
                      ?.latitude || bestLatitude,
                    parsedParticipants.find((p) => p.fullName === selectedUser)
                      ?.longitude || bestLongitude,
                    bestLatitude,
                    bestLongitude,
                    item.mode,
                  )
                }
              >
                <Text style={styles.travelMode}>{item.mode.toUpperCase()}</Text>
                <Text>{item.duration}</Text>
                <Text>{item.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Transit Steps */}
      {selectedMode === "transit" && transitSteps.length > 0 && (
        <View style={styles.transitStepsContainer}>
          <ScrollView>
            {transitSteps.map((step, index) => (
              <View key={index} style={styles.transitStep}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                <Text style={styles.stepDetail}>
                  Distance: {step.distance} | Duration: {step.duration}
                </Text>
                {step.transitDetails && (
                  <Text style={styles.transitDetail}>
                    Take {step.transitDetails.vehicle} (
                    {step.transitDetails.line}) from{" "}
                    {step.transitDetails.departureStop} to{" "}
                    {step.transitDetails.arrivalStop} (
                    {step.transitDetails.numStops} stops)
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  dropdownContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  picker: {
    height: 40,
    width: "100%",
  },
  map: {
    flex: 1,
  },
  travelTimesContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  travelTimeCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
  },
  selectedCard: {
    backgroundColor: "#ED8F03",
  },
  travelMode: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  transitStepsContainer: {
    position: "absolute",
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  transitStep: {
    marginBottom: 10,
  },
  stepInstruction: {
    fontWeight: "bold",
  },
  stepDetail: {
    color: "#555",
  },
  transitDetail: {
    color: "#777",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 10,
    backgroundColor: "#ED8F03",
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
