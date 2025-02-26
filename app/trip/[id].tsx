import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import MapView, { Marker } from "react-native-maps";
import { FontAwesome } from "@expo/vector-icons";
import moment from "moment";
import axios from "axios";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthProvider";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler"; // !!! need to replace PanGestureHandler with an alternative !!!

export default function TripDetailsScreen() {
  const { user } = useAuth();
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [bestLocation, setBestLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startingLocation, setStartingLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [progress, setProgress] = useState(new Animated.Value(0)); // For progress animation
  const [searchStatus, setSearchStatus] = useState("Starting search...");
  const [candidateResults, setCandidateResults] = useState([]);
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
  useEffect(() => {
    fetchTripDetails();
  }, []);

  function extractPhotoUrls(photos) {
    return photos.map(
      (photo) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`,
    );
  }

  // Search new starting location
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
  };

  // Change the starting location
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

      const location = {
        latitude: response.data.result.geometry.location.lat,
        longitude: response.data.result.geometry.location.lng,
      };
      console.log("This is location ", location);
      let r = await Location.reverseGeocodeAsync(location);
      if (r.length > 0) {
        const { city, region, country, streetNumber, street, postalCode } =
          r[0];
        const locationName = `${streetNumber} ${street}, ${city}, ${region}, ${country}, ${postalCode}`;

        // ✅ Save the selected participant's new location in Supabase
        const { error } = await supabase
          .from("trip_participants")
          .update({
            starting_location: locationName,
            latitude: location.latitude,
            longitude: location.longitude,
          })
          .eq("trip_id", tripId)
          .eq("user_id", selectedParticipant.id); // Ensure we update only this user

        if (!error) {
          fetchParticipants(); // Refresh data
          Alert.alert(
            "Success",
            `Updated location for ${selectedParticipant.full_name}!`,
          );
        }
      }
      setOverlayVisible(false);
    } catch (error) {
      console.error("Error selecting location:", error);
    }
  };

  /** 📌 Fetch trip details */
  async function fetchTripDetails() {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (!error) {
      setTrip(data);
      setBestLocation({
        best_latitude: data.best_latitude,
        best_longitude: data.best_longitude,
        best_address: data.best_address,
        best_place_id: data.best_place_id,
        best_photos: data.best_photos,
      });
      fetchParticipants();
    }
  }

  /** 📌 Fetch participants along with starting locations */
  async function fetchParticipants() {
    try {
      // Step 1: Get all user IDs and starting locations in the trip
      const { data: participantData, error: participantError } = await supabase
        .from("trip_participants")
        .select("user_id, starting_location, latitude, longitude")
        .eq("trip_id", tripId);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setParticipants([]);
        return;
      }

      // Extract user IDs and their starting locations
      const userIdMap = participantData.reduce((acc, participant) => {
        acc[participant.user_id] = participant.starting_location;
        return acc;
      }, {});

      const userIds = Object.keys(userIdMap);

      // Step 2: Fetch user details (full_name) from the users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Step 3: Combine user details with their starting locations
      const participantsList = usersData.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        starting_location: userIdMap[user.id] || "Not set",
        latitude:
          participantData.find((p) => p.user_id === user.id)?.latitude || null,
        longitude:
          participantData.find((p) => p.user_id === user.id)?.longitude || null,
      }));
      setParticipants(participantsList);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  }

  // 📍 Handle Map Selection
  const handleSelectLocation = (coordinate) => {
    setSelectedLocation(coordinate);
  };

  // 📍 Confirm & Reverse Geocode Address
  const confirmLocation = async () => {
    if (!selectedLocation || !selectedParticipant) return;
    console.log("aefjnsrngirasngoasrgadgijsrgi location:", selectedLocation);
    let response = await Location.reverseGeocodeAsync(selectedLocation);
    if (response.length > 0) {
      const { city, region, country, streetNumber, street, postalCode } =
        response[0];
      const locationName = `${streetNumber} ${street}, ${city}, ${region}, ${country}, ${postalCode}`;

      // ✅ Save the selected participant's new location in Supabase
      const { error } = await supabase
        .from("trip_participants")
        .update({
          starting_location: locationName,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        })
        .eq("trip_id", tripId)
        .eq("user_id", selectedParticipant.id); // Ensure we update only this user

      if (!error) {
        fetchParticipants(); // Refresh data
        Alert.alert(
          "Success",
          `Updated location for ${selectedParticipant.full_name}!`,
        );
      }
    }

    setMapModalVisible(false);
  };

  if (!trip) return null;

  // 📍 Find Best Destination

  // 1️⃣ User presses "Find Best Location" button
  // 2️⃣ Fetch all participants’ locations
  // 3️⃣ Compute midpoint
  // 4️⃣ Get real meeting places (Google Places API)
  // 5️⃣ Compute travel times (Google Distance Matrix API)
  // 6️⃣ Select the best location (minimum total travel time)
  // 7️⃣ Save to Supabase & update UI

  /** 📍 Find Best Destination (Now Interactive & Real-time) */
  async function handleFindBestLocation() {
    try {
      setLoading(true);
      setSearchStatus("Finding best location...");
      Animated.timing(progress, {
        toValue: 0, // Reset progress bar
        duration: 300,
        useNativeDriver: false,
      }).start();

      console.log("Finding best location...");
      const participants = await fetchTripParticipants(tripId);

      if (participants.length === 0) {
        Alert.alert("Error", "No participants with valid locations.");
        setLoading(false);
        return;
      }

      setSearchStatus("Computing midpoint...");
      const midpoint = computeMidpoint(participants);

      setSearchStatus("Fetching nearby locations...");
      const candidates = await fetchCandidateLocations(midpoint);

      if (candidates.length === 0) {
        Alert.alert(
          "No Places Found",
          "No suitable locations were found nearby.",
        );
        setLoading(false);
        return;
      }

      setCandidateResults(candidates); // Show candidates live in the UI

      let bestLocation = null;
      let bestTravelTime = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        setSearchStatus(`Analyzing ${candidate.name}...`);
        Animated.timing(progress, {
          toValue: (i + 1) / candidates.length, // Increment progress bar
          duration: 500,
          useNativeDriver: false,
        }).start();

        const totalTime = await fetchTravelTimes(participants, candidate);

        if (totalTime !== null && totalTime < bestTravelTime) {
          bestTravelTime = totalTime;
          bestLocation = candidate;
        }
      }

      if (!bestLocation) {
        Alert.alert("Error", "Could not determine the best location.");
        setLoading(false);
        return;
      }

      setSearchStatus("Finalizing location...");
      const photos_uri = extractPhotoUrls(bestLocation.photos);
      bestLocation.photos = photos_uri;
      setBestLocation(bestLocation);

      // Update database with the best location
      const { error } = await supabase
        .from("trips")
        .update({
          best_location: bestLocation.name,
          best_latitude: bestLocation.latitude,
          best_longitude: bestLocation.longitude,
          best_address: bestLocation.address,
          best_place_id: bestLocation.place_id,
          best_photos: photos_uri,
        })
        .eq("id", tripId);

      if (!error) {
        Alert.alert("Success", `Best location found: ${bestLocation.name}`);
        fetchTripDetails(); // Refresh data
      }
    } catch (error) {
      console.error("Error finding best location:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTripParticipants(tripId) {
    try {
      const { data, error } = await supabase
        .from("trip_participants")
        .select("user_id, latitude, longitude")
        .eq("trip_id", tripId)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  }

  function computeMidpoint(locations) {
    if (locations.length === 0) return null;

    let latSum = 0,
      lonSum = 0;

    locations.forEach(({ latitude, longitude }) => {
      latSum += latitude;
      lonSum += longitude;
    });

    return {
      latitude: latSum / locations.length,
      longitude: lonSum / locations.length,
    };
  }

  async function fetchCandidateLocations(midpoint) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=5000&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) return [];

      return data.results.map((place) => ({
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        address: place.vicinity,
        place_id: place.place_id,
        photos: place.photos,
      }));
    } catch (error) {
      console.error("Error fetching candidate locations:", error);
      return [];
    }
  }

  async function fetchTravelTimes(participants, candidate) {
    const origins = participants
      .map((p) => `${p.latitude},${p.longitude}`)
      .join("|");
    const destination = `${candidate.latitude},${candidate.longitude}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!data.rows) return null;

      const totalTravelTime = data.rows.reduce((sum, row) => {
        if (row.elements[0].status === "OK") {
          return sum + row.elements[0].duration.value;
        }
        return sum;
      }, 0);
      console.log("Travel times:", totalTravelTime);

      return totalTravelTime; // Total travel time in seconds
    } catch (error) {
      console.error("Error fetching travel times:", error);
      return null;
    }
  }

  async function findOptimalDestination(tripId) {
    const participants = await fetchTripParticipants(tripId);
    if (participants.length === 0) return null;

    const midpoint = computeMidpoint(participants);
    const candidates = await fetchCandidateLocations(midpoint);

    let bestLocation = null;
    let bestTravelTime = Infinity;

    for (const candidate of candidates) {
      const totalTime = await fetchTravelTimes(participants, candidate);
      if (totalTime !== null && totalTime < bestTravelTime) {
        bestTravelTime = totalTime;
        bestLocation = candidate;
      }
    }

    return bestLocation;
  }

  return (
    <View className="flex-1 bg-gray-100">
      <GestureHandlerRootView className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 300 + 30 * participants.length,
          }} // ✅ Ensures scrollability
          showsVerticalScrollIndicator={false}
        >
          {/* 📌 Header */}
          <View className="flex-row justify-between items-center px-6 py-16 bg-white shadow-lg border-b border-gray-300">
            <Text className="text-lg font-bold text-black">
              Trip: {trip?.name || "Loading..."}
            </Text>
            <TouchableOpacity>
              <FontAwesome name="user-circle" size={28} color="black" />
            </TouchableOpacity>
          </View>

          {/* 📌 Trip Destination */}
          <Image
            source={{
              uri: trip?.best_photos?.[0] || "https://via.placeholder.com/800",
            }}
            className="w-full h-[50%] rounded-lg"
          />
          <Text className="text-2xl font-bold text-center my-4">
            {trip?.best_location || "Unknown Destination"}
          </Text>

          {/* 📌 Trip Details */}
          <View className="p-6 bg-white rounded-lg shadow-md mx-4 mt-4">
            <Text className="text-lg font-semibold">When:</Text>
            <Text className="text-sm text-gray-600">
              {trip?.start_date
                ? moment(trip.start_date).format("MM/DD/YYYY - hh:mm A") +
                  " to " +
                  moment(trip.end_date).format("MM/DD/YYYY - hh:mm A")
                : "Loading..."}
            </Text>

            {/* 📌 Participants */}
            <Text className="text-lg font-semibold mt-4">Participants:</Text>
            <View className="flex-row flex-wrap mt-2">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <View
                    key={participant.id}
                    className="bg-orange-300 px-3 py-1 rounded-full m-1"
                  >
                    <Text className="text-sm">{participant.full_name}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">No participants yet</Text>
              )}
            </View>
          </View>

          {/* 📌 List of Participants */}
          {/* <Text className="text-lg font-bold text-gray-900 px-6 mt-4">Trip Participants</Text>
        {participants.map((item) => (
          <View
            key={item.id}
            className="bg-white p-4 rounded-xl mx-4 my-2 shadow-md border border-gray-200"
          >
            <Text className="text-lg font-bold text-gray-900">{item.full_name || "Unknown"}</Text>
            <Text className="text-sm text-gray-500">
              Starting Location: {item.starting_location || "Not set"}
            </Text>
          </View>
        ))} */}

          {/* 📌 List of Participants - Now Clickable */}
          <Text className="text-lg font-bold text-gray-900 px-6 mt-4">
            Trip Participants
          </Text>

          {participants.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white p-4 rounded-xl mx-4 my-2 shadow-md border border-gray-200"
              onPress={() => {
                setSelectedParticipant(item); // Store selected participant
                setMapModalVisible(true); // Open the map picker modal
              }}
            >
              <Text className="text-lg font-bold text-gray-900">
                {item.full_name || "Unknown"}
              </Text>
              <Text className="text-sm text-gray-500">
                Starting Location: {item.starting_location || "Not set"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 📌 Floating Action Buttons */}
        <View className="flex-row justify-around my-4 bg-transparent justify-around p-6">
          <TouchableOpacity className="bg-orange-500 px-6 py-3 rounded-lg shadow-lg">
            <Text className="text-white font-bold">Start Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg shadow-lg"
            onPress={() => {
              if (!bestLocation) {
                Alert.alert("Error", "Find the best location first.");
                return;
              }
              router.push({
                pathname: "/map",
                params: {
                  bestLatitude: bestLocation.best_latitude,
                  bestLongitude: bestLocation.best_longitude,
                  participants: JSON.stringify(participants),
                },
              });
            }}
          >
            <Text className="text-white font-bold">Show Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-6 py-3 rounded-lg shadow-lg ${loading ? "bg-gray-400" : "bg-gray-300"}`}
            onPress={handleFindBestLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-gray-800 font-bold">Get Best Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 📌 Map Picker Modal */}
        <Modal visible={mapModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/50 backdrop-blur-md justify-center items-center">
            <View className="w-[90%] h-[80%] bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* 📌 Header */}
              <Text className="text-lg font-bold text-gray-900 text-center my-4">
                Update Starting Location for {selectedParticipant?.full_name}
              </Text>

              {/* 📌 Map View */}
              <MapView
                style={{ width: "100%", height: "75%" }}
                initialRegion={{
                  latitude: selectedParticipant?.latitude || 38.65709289910062,
                  longitude:
                    selectedParticipant?.longitude || -90.30219997026222,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                onPress={(e) => handleSelectLocation(e.nativeEvent.coordinate)}
              >
                {selectedLocation && (
                  <Marker coordinate={selectedLocation} title="New Location" />
                )}
              </MapView>

              {/* 📌 Change Location Button */}
              <TouchableOpacity
                className="bg-orange-500 px-4 py-3 mx-4 my-2 rounded-lg shadow-lg"
                onPress={() => {
                  setMapModalVisible(false);
                  setOverlayVisible(true);
                }}
              >
                <Text className="text-white font-bold text-center ">
                  Search Your Location
                </Text>
              </TouchableOpacity>

              {/* 📌 Confirm & Cancel Buttons */}
              <View className="flex-row justify-between p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                  className="bg-orange-500 py-3 w-[48%] rounded-xl shadow-lg"
                  onPress={confirmLocation}
                >
                  <Text className="text-white font-bold text-center text-lg">
                    Confirm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-gray-300 py-3 w-[48%] rounded-xl"
                  onPress={() => {
                    setMapModalVisible(false);
                    setSelectedLocation(null);
                    setOverlayVisible(false);
                  }}
                >
                  <Text className="text-gray-800 font-bold text-center text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* 📌 Overlay Modal for Searching Locations */}
        <Modal animationType="slide" visible={isOverlayVisible} transparent>
          <View className="flex-1 justify-end bg-black/50">
            <PanGestureHandler
              onGestureEvent={(e) => {
                if (e.nativeEvent.translationY > 100) setOverlayVisible(false);
              }}
            >
              <View className="w-full h-[70%] bg-white rounded-t-2xl p-6 shadow-xl">
                {/* Drag Indicator */}
                <View className="w-14 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

                {/* Search Input */}
                <TextInput
                  className="border border-gray-300 p-3 rounded-lg bg-gray-100"
                  placeholder="Search for location..."
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    searchLocation(text);
                  }}
                />

                {/* Search Results List */}
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setOverlayVisible(false); // Close modal after selection
                        selectLocation(item.place_id); // Update starting location
                        setSearchText(""); // Clear search text
                      }}
                      className="p-4 border-b border-gray-200"
                    >
                      <Text className="text-gray-800">{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </PanGestureHandler>
          </View>
        </Modal>
      </GestureHandlerRootView>
    </View>
  );
}
