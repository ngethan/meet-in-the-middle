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
import axios from "axios";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
  const [openDropdown, setOpenDropdown] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([
    { label: "All", value: "All" },
    ...parsedParticipants.map((participant) => ({
      label: participant.fullName,
      value: participant.fullName,
    })),
  ]);

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
      if (selectedUser === "All") {
        fetchRoutes(parsedParticipants, selectedMode);
      } else {
        const participant = parsedParticipants.find(
          (p) => p.fullName === selectedUser,
        );
        if (participant) {
          fetchRoute(
            participant.latitude,
            participant.longitude,
            bestLatitude,
            bestLongitude,
            selectedMode,
          ).then((route) => {
            setRouteCoords([route]);
          });
        }
      }
    } else {
      setLoading(false);
    }
  }, [
    bestLatitude,
    bestLongitude,
    parsedParticipants,
    selectedUser,
    selectedMode,
  ]);

  useEffect(() => {
    // Update dropdown items when parsedParticipants changes
    setDropdownItems([
      { label: "All", value: "All" },
      ...parsedParticipants.map((participant) => ({
        label: participant.fullName,
        value: participant.fullName,
      })),
    ]);
  }, [parsedParticipants]);

  useEffect(() => {
    setTransitSteps([]);

    if (selectedUser !== "All") {
      fetchUserTravelTimes(selectedUser);
    }
  }, [selectedUser]);

  async function fetchRoutes(participants, mode = "driving") {
    let fetchedRoutes = [];
    let allRouteCoords = [];

    for (const participant of participants) {
      if (participant.latitude && participant.longitude) {
        const route = await fetchRoute(
          participant.latitude,
          participant.longitude,
          bestLatitude,
          bestLongitude,
          mode,
        );
        if (route.length > 0) {
          fetchedRoutes.push(route);
          allRouteCoords.push(route);
        }
      }
    }

    setRoutes(fetchedRoutes);
    setRouteCoords(allRouteCoords);
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

        return decodedCoords;
      }
    } catch (error) {
      console.error(`Error fetching route for ${mode}:`, error);
    }
    return [];
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

        {parsedParticipants.map((participant, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: participant.latitude,
              longitude: participant.longitude,
            }}
            title={participant.fullName}
            pinColor={routeColors[index % routeColors.length]}
          />
        ))}

        {selectedUser === "All"
          ? routeCoords.map((coords, index) => (
              <Polyline
                key={index}
                coordinates={coords}
                strokeWidth={4}
                strokeColor={routeColors[index % routeColors.length]}
              />
            ))
          : routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords[0]}
                strokeWidth={4}
                strokeColor="blue"
              />
            )}
      </MapView>

      {/* Dropdown and Travel Modes */}
      <View style={styles.bottomContainer}>
        {/* Dropdown Menu */}
        <View style={styles.dropdownContainer}>
          <DropDownPicker
            open={openDropdown}
            value={selectedUser}
            items={dropdownItems}
            setOpen={setOpenDropdown}
            setValue={setSelectedUser}
            setItems={setDropdownItems}
            placeholder="Select a participant"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              backgroundColor: "#f9f9f9",
            }}
            dropDownContainerStyle={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
            }}
          />
        </View>

        {/* Transit Steps */}
        {selectedUser !== "All" &&
          selectedMode === "transit" &&
          transitSteps.length > 0 && (
            <View style={styles.stepsContainer}>
              <ScrollView>
                {transitSteps.map((step, index) => (
                  <View key={index} style={styles.step}>
                    <Text style={styles.stepInstruction}>
                      {step.instruction}
                    </Text>
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

        {/* Travel Modes */}
        <View style={styles.travelTimesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedUser === "All"
              ? travelModes.map((mode, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.travelTimeCard,
                      selectedMode === mode ? styles.selectedCard : null,
                    ]}
                    onPress={() => {
                      setSelectedMode(mode); // Update the selected mode
                      fetchRoutes(parsedParticipants, mode); // Fetch routes for all users
                    }}
                  >
                    <Text style={styles.travelMode}>{mode.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))
              : userTravelTimes.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.travelTimeCard,
                      selectedMode === item.mode ? styles.selectedCard : null,
                    ]}
                    onPress={() => {
                      setSelectedMode(item.mode); // Update the selected mode
                      fetchRoute(
                        parsedParticipants.find(
                          (p) => p.fullName === selectedUser,
                        )?.latitude || bestLatitude,
                        parsedParticipants.find(
                          (p) => p.fullName === selectedUser,
                        )?.longitude || bestLongitude,
                        bestLatitude,
                        bestLongitude,
                        item.mode,
                      ).then((route) => {
                        setRouteCoords([route]); // Update the route for the selected user
                      });
                    }}
                  >
                    <Text style={styles.travelMode}>
                      {item.mode.toUpperCase()}
                    </Text>
                    <Text>{item.duration}</Text>
                    <Text>{item.distance}</Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>
      </View>

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
  map: {
    flex: 1,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 40,
    left: 10,
    right: 10,
    flexDirection: "column",
    gap: 10,
  },
  dropdownContainer: {
    zIndex: 10,
  },
  travelTimesContainer: {
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
    backgroundColor: "#3b82f6",
  },
  travelMode: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#3b82f6",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 10,
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  stepsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    height: 150,
    borderTopWidth: 1,
    borderColor: "#3b82f6",
  },
  step: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#3b82f6",
    paddingBottom: 5,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  stepDetail: {
    fontSize: 12,
    color: "#3b82f6",
  },
  transitDetail: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 5,
  },
});
