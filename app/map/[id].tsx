import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import * as Location from "expo-location";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
console.log(GOOGLE_MAPS_API_KEY);
const polyline = require("@mapbox/polyline");

export default function MapScreen() {
  const { id } = useLocalSearchParams();
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [travelTimes, setTravelTimes] = useState<
    { mode: string; duration: string; distance: string }[]
  >([]);
  const [selectedMode, setSelectedMode] = useState("driving");
  const [transitSteps, setTransitSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const travelModes = ["driving", "walking", "bicycling", "transit"];

  useEffect(() => {
    fetchInitialLocationData();
  }, [id]);

  // Get initial location data
  const fetchInitialLocationData = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: id,
            key: GOOGLE_MAPS_API_KEY,
            fields: "geometry",
          },
        },
      );

      // get destination
      const destinationLoc = response.data.result.geometry.location;
      setDestination({
        latitude: destinationLoc.lat,
        longitude: destinationLoc.lng,
      });

      await fetchAllRouteDetails(
        latitude,
        longitude,
        destinationLoc.lat,
        destinationLoc.lng,
      );
      await fetchRoute(
        latitude,
        longitude,
        destinationLoc.lat,
        destinationLoc.lng,
        "driving",
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // get route from the starting point to the destination
  const fetchRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    mode: string,
  ) => {
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

      // when route exists
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const points = route.overview_polyline.points;
        const decodedCoords = decodePolyline(points);
        setRouteCoords(decodedCoords);
        setSelectedMode(mode);

        if (mode === "transit") {
          const steps = route.legs[0].steps.map((step: any) => ({
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
      } else {
        console.warn(`No route found for ${mode}.`);
        setRouteCoords([]); // Clear any existing route
        setTransitSteps([]); // Clear transit steps
        alert(
          `No route found for ${mode}. Please try another mode or location.`,
        );
      }
    } catch (error) {
      console.warn(`Error fetching route for ${mode}:`, error);
      setRouteCoords([]);
      setTransitSteps([]);
      alert(
        `Could not find a route for ${mode}. Please check your connection or try another location.`,
      );
    }
  };

  // Draw route line on the map
  const decodePolyline = (
    encoded: string,
  ): { latitude: number; longitude: number }[] => {
    let points: [number, number][] = polyline.decode(encoded);
    return points.map(([lat, lng]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));
  };

  // Get details about the route
  const fetchAllRouteDetails = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) => {
    let times = [];
    for (const mode of travelModes) {
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
          // No route found, push N/A without error
          times.push({ mode, duration: "N/A", distance: "N/A" });
        }
      } catch (error) {
        console.warn(`Warning: No route found for ${mode}.`);
        times.push({ mode, duration: "N/A", distance: "N/A" });
      }
    }
    setTravelTimes(times);
  };

  // Search new starting location
  const searchLocation = async (text: string) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: text,
            key: GOOGLE_MAPS_API_KEY,
            types: "establishment|geocode",
          },
        },
      );
      setSearchResults(response.data.predictions);
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  // Change the starting location
  const selectLocation = async (placeId: string | null) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_MAPS_API_KEY,
            fields: "geometry",
          },
        },
      );

      const location = response.data.result.geometry.location;
      setCurrentLocation({ latitude: location?.lat, longitude: location.lng });
      setOverlayVisible(false);
      await fetchRoute(
        location.lat,
        location.lng,
        destination?.latitude || 0,
        destination?.longitude || 0,
        selectedMode,
      );
      await fetchAllRouteDetails(
        location.lat,
        location.lng,
        destination?.latitude || 0,
        destination?.longitude || 0,
      );
    } catch (error) {
      console.error("Error selecting location:", error);
    }
  };

  // While loading the map
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED8F03" />
        <Text>Loading Map...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 38.627,
          longitude: currentLocation?.longitude || -90.1994,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor="red" />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.changeLocationButton}
          onPress={() => setOverlayVisible(true)}
        >
          <Text style={styles.changeLocationText}>Change Your Location</Text>
        </TouchableOpacity>
      </MapView>

      {/* Bottom Info Bar */}
      <View style={styles.infoContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {travelTimes.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                selectedMode === item.mode ? styles.selectedCard : null,
              ]}
              onPress={() =>
                fetchRoute(
                  currentLocation?.latitude || 0,
                  currentLocation?.longitude || 0,
                  destination?.latitude || 0,
                  destination?.longitude || 0,
                  item.mode,
                )
              }
            >
              <Text style={styles.modeText}>{item.mode.toUpperCase()}</Text>
              <Text style={styles.durationText}>{item.duration}</Text>
              <Text style={styles.distanceText}>{item.distance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Overlay Modal */}
      <Modal animationType="slide" visible={isOverlayVisible} transparent>
        <PanGestureHandler
          onGestureEvent={(e) => {
            if (e.nativeEvent.translationY > 100) setOverlayVisible(false);
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.overlayHeader} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search for location..."
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                searchLocation(text);
              }}
            />
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectLocation(item.place_id)}
                  style={styles.searchItem}
                >
                  <Text>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </PanGestureHandler>
      </Modal>

      {/* Transit Steps */}
      {selectedMode === "transit" && transitSteps.length > 0 && (
        <View style={styles.stepsContainer}>
          <FlatList
            data={transitSteps}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.step}>
                <Text style={styles.stepInstruction}>{item.instruction}</Text>
                <Text style={styles.stepDetail}>
                  Distance: {item.distance} | Duration: {item.duration}
                </Text>
                {item.transitDetails && (
                  <Text style={styles.transitDetail}>
                    Take {item.transitDetails.vehicle} (
                    {item.transitDetails.line}) from{" "}
                    {item.transitDetails.departureStop} to{" "}
                    {item.transitDetails.arrivalStop} (
                    {item.transitDetails.numStops} stops)
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  map: {
    width: "100%",
    height: "85%",
  },
  backButtonContainer: {
    position: "absolute",
    top: 20,
    left: 10,
  },
  backButton: {
    backgroundColor: "purple",
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  changeLocationButton: {
    position: "absolute",
    bottom: 15,
    right: 10,
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 8,
  },
  changeLocationText: {
    color: "#fff",
    fontWeight: "bold",
  },
  infoContainer: {
    height: "15%",
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  selectedCard: {
    backgroundColor: "#009FFF",
  },
  modeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  durationText: {
    fontSize: 14,
    color: "#555",
  },
  distanceText: {
    fontSize: 14,
    color: "#777",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  overlayHeader: {
    width: 60,
    height: 6,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  stepsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    height: "20%",
  },
  step: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 5,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepDetail: {
    fontSize: 12,
    color: "#666",
  },
  transitDetail: {
    fontSize: 12,
    color: "#444",
    marginTop: 5,
  },
});
