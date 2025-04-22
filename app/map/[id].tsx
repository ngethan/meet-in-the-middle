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
import MapView, { Polyline } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import * as Location from "expo-location";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import {
  ArrowLeft,
  MapPin,
  Car,
  User,
  Bike,
  Bus,
  Clock,
  Search,
  X,
} from "lucide-react-native";
import { Marker } from "react-native-maps";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ED8F03" />
        <Text>Loading Map...</Text>
      </View>
    );
  }
  return (
    <GestureHandlerRootView className="flex-1">
      <MapView
        provider="google"
        googleMapId={GOOGLE_MAPS_API_KEY}
        className="w-full h-[85%]"
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
            strokeColor="#3b82f6"
          />
        )}
      </MapView>

      {/* Back Button */}
      <View className="absolute top-12 left-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-3 bg-white rounded-full shadow-md active:bg-gray-100"
        >
          <ArrowLeft size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Change Location Button */}
      <TouchableOpacity
        onPress={() => setOverlayVisible(true)}
        className="absolute bottom-32 right-4 bg-white px-4 py-3 rounded-full shadow-lg active:bg-gray-50 z-10 flex-row items-center"
      >
        <MapPin size={18} color="#3b82f6" />
        <Text className="text-gray-800 font-medium ml-2">Change Location</Text>
      </TouchableOpacity>

      {/* Bottom Info Bar */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-lg pt-4 pb-6 px-2">
        <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-2"
        >
          {travelTimes.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`mx-2 p-4 rounded-xl shadow-sm ${
                selectedMode === item.mode
                  ? "bg-blue-500"
                  : "bg-white border border-gray-100"
              }`}
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
              <View className="flex-row items-center justify-center mb-2">
                {item.mode === "driving" && (
                  <Car
                    size={20}
                    color={selectedMode === item.mode ? "#fff" : "#3b82f6"}
                  />
                )}
                {item.mode === "walking" && (
                  <User
                    size={20}
                    color={selectedMode === item.mode ? "#fff" : "#3b82f6"}
                  />
                )}
                {item.mode === "bicycling" && (
                  <Bike
                    size={20}
                    color={selectedMode === item.mode ? "#fff" : "#3b82f6"}
                  />
                )}
                {item.mode === "transit" && (
                  <Bus
                    size={20}
                    color={selectedMode === item.mode ? "#fff" : "#3b82f6"}
                  />
                )}
                <Text
                  className={`ml-2 font-bold ${
                    selectedMode === item.mode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.mode.toUpperCase()}
                </Text>
              </View>
              <Text
                className={`text-center text-base font-semibold ${
                  selectedMode === item.mode ? "text-white" : "text-gray-700"
                }`}
              >
                {item.duration}
              </Text>
              <Text
                className={`text-center text-xs ${
                  selectedMode === item.mode ? "text-white/80" : "text-gray-500"
                }`}
              >
                {item.distance}
              </Text>
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
          <View className="absolute bottom-0 w-full h-[70%] bg-white rounded-t-3xl shadow-xl">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-6" />
            <TouchableOpacity
              onPress={() => setOverlayVisible(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-gray-100"
            >
              <X size={20} color="#666" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 px-6 mb-4">
              Change Starting Location
            </Text>
            <View className="px-6 mb-4">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Search size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="Search for location..."
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    searchLocation(text);
                  }}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <X size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              className="px-6"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectLocation(item.place_id)}
                  className="py-4 border-b border-gray-100 flex-row items-center"
                >
                  <MapPin size={18} color="#3b82f6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800 font-medium">
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchText.length > 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">No locations found</Text>
                  </View>
                ) : null
              }
            />
          </View>
        </PanGestureHandler>
      </Modal>

      {/* Transit Steps */}
      {selectedMode === "transit" && transitSteps.length > 0 && (
        <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-xl pt-4 h-[60%] z-20">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <TouchableOpacity
            className="absolute right-4 top-4 p-2 rounded-full bg-gray-100"
            onPress={() => setTransitSteps([])}
          >
            <X size={20} color="#666" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 px-6 mb-4">
            Transit Directions
          </Text>
          <FlatList
            data={transitSteps}
            keyExtractor={(item, index) => index.toString()}
            className="px-4"
            renderItem={({ item }) => (
              <View className="mb-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <Text className="text-gray-800 font-semibold mb-1">
                  {item.instruction}
                </Text>
                <View className="flex-row items-center mb-2">
                  <Clock size={14} color="#666" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.duration}
                  </Text>
                  <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
                  <MapPin size={14} color="#666" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {item.distance}
                  </Text>
                </View>
                {item.transitDetails && (
                  <View className="mt-2 p-3 bg-white rounded-lg">
                    <View className="flex-row items-center">
                      <Bus size={16} color="#3b82f6" />
                      <Text className="text-blue-500 font-medium ml-2">
                        {item.transitDetails.line} {item.transitDetails.vehicle}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                      <View className="w-2 h-2 rounded-full bg-green-500" />
                      <Text className="text-gray-700 ml-2 flex-1">
                        {item.transitDetails.departureStop}
                      </Text>
                    </View>
                    <View className="h-6 border-l border-dashed border-gray-300 ml-1" />
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500" />
                      <Text className="text-gray-700 ml-2 flex-1">
                        {item.transitDetails.arrivalStop}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2">
                      {item.transitDetails.numStops} stops
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}
