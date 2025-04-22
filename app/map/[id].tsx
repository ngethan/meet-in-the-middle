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
} from "react-native-gesture-handler"; // !!! need to replace PanGestureHandler with an alternative !!!

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const polyline = require("@mapbox/polyline");

export default function MapScreen() {
  const { id } = useLocalSearchParams();
  const [destination, setDestination] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [travelTimes, setTravelTimes] = useState([]);
  const [selectedMode, setSelectedMode] = useState("driving");
  const [transitSteps, setTransitSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const travelModes = ["driving", "walking", "bicycling", "transit"];

  useEffect(() => {
    fetchInitialLocationData();
  }, [id]); // Get initial location data

  const fetchInitialLocationData = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      } // Get current location

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
      ); // get destination

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
  }; // get route from the starting point to the destination

  const fetchRoute = async (startLat, startLng, endLat, endLng, mode) => {
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
      ); // when route exists

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const points = route.overview_polyline.points;
        const decodedCoords = decodePolyline(points);
        setRouteCoords(decodedCoords);
        setSelectedMode(mode);

        if (mode === "transit") {
          const steps = route.legs[0].steps.map((step) => ({
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
  }; // Draw route line on the map

  const decodePolyline = (
    encoded: string,
  ): { latitude: number; longitude: number }[] => {
    let points: [number, number][] = polyline.decode(encoded);
    return points.map(([lat, lng]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }; // Get details about the route

  const fetchAllRouteDetails = async (startLat, startLng, endLat, endLng) => {
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
  }; // Search new starting location

  const searchLocation = async (text) => {
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
  }; // Change the starting location

  const selectLocation = async (placeId) => {
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
  }; // While loading the map

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
            {/* Map */}
            
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 38.6488, // Default WashU latitude
          longitude: currentLocation?.longitude || -90.3108, // Default WashU longitude
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
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
            strokeColor="#2196F3" // Changed to a standard blue color
          />
        )}
                {/* Back Button */}
                
        <View style={styles.backButtonContainer}>
                    
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
                        <Text style={styles.backButtonText}>Back</Text>
                      
          </TouchableOpacity>
                  
        </View>
              
      </MapView>
            {/* Bottom Section */}
            
      <View style={styles.bottomContainer}>
                {/* Change Your Location Button */}
                
        <TouchableOpacity
          style={styles.changeLocationButton}
          onPress={() => setOverlayVisible(true)}
        >
                    
          <Text style={styles.changeLocationText}>Change Your Location</Text>
                  
        </TouchableOpacity>
                {/* Transit Steps */}
                
        {selectedMode === "transit" && transitSteps.length > 0 && (
          <View style={styles.stepsContainer}>
            <ScrollView>
              {transitSteps.map((step, index) => (
                <View key={index} style={styles.step}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                                    
                  <Text style={styles.stepDetail}>
                                        Distance: {step.distance} | Duration:{" "}
                    {step.duration}
                                      
                  </Text>
                                    
                  {step.transitDetails && (
                    <Text style={styles.transitDetail}>
                                            Take {step.transitDetails.vehicle} (
                                            {step.transitDetails.line}) from{" "}
                                            {step.transitDetails.departureStop}{" "}
                      to                       {step.transitDetails.arrivalStop}{" "}
                      (                       {step.transitDetails.numStops}{" "}
                      stops)                     
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
                        
            {travelTimes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.travelTimeCard,
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
                                
                <Text style={styles.travelMode}>{item.mode.toUpperCase()}</Text>
                                
                <Text style={styles.durationText}>{item.duration}</Text>
                                
                <Text style={styles.distanceText}>{item.distance}</Text>
                              
              </TouchableOpacity>
            ))}
                      
          </ScrollView>
                  
        </View>
              
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
    </GestureHandlerRootView>
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
  map: {
    flex: 1,
  },
  changeLocationButton: {
    backgroundColor: "#0066CC",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  changeLocationText: {
    color: "#fff",
    fontWeight: "bold",
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
    backgroundColor: "#0066CC",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#0066CC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#0066CC",
  },
  infoContainer: {
    height: "10%",
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#e6f2ff",
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  selectedCard: {
    backgroundColor: "#0066CC",
    color: "#fff",
  },
  modeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003366",
  },
  stepsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    height: "20%",
  },
  step: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#0066CC",
    paddingBottom: 5,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#003366",
  },
  stepDetail: {
    fontSize: 12,
    color: "#0066CC",
  },
  transitDetail: {
    fontSize: 12,
    color: "#0066CC",
    marginTop: 5,
  },
  buttonContainer: {
    position: "absolute",
    top: 50,
    left: 10,
  },
  travelTimesContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  travelTimeCard: {
    backgroundColor: "#e6f2ff",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
  },
  travelMode: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#003366",
  },
  durationText: {
    fontSize: 14,
    color: "#000",
  },
  distanceText: {
    fontSize: 14,
    color: "#000",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 40,
    left: 10,
    right: 10,
    flexDirection: "column",
    gap: 10,
  },
  backButtonContainer: {
    position: "absolute",
    top: 20,
    left: 5,
  },
  backButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    shadowColor: "#0066CC",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
