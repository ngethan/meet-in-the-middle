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
  Linking,
} from "react-native";
import Toast from "react-native-toast-message";
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
import LoadingOverlay from "../loadingoverlay";
import DropDownPicker from "react-native-dropdown-picker";
import { LocationProvider, useLocationTypes } from "@/context/LocationProvider";
import DateTimePicker from "@react-native-community/datetimepicker";

// // Sample some categories
// const typeMappings: Record<string, { label: string; value: string }> = {
//   stadium: { label: "Stadiums 🏟️", value: "stadiums" },
//   tourist_attraction: { label: "Tourist Attractions 🌍", value: "tourist_attractions" },
//   point_of_interest: { label: "Points of Interest 📍", value: "points_of_interest" },
//   establishment: { label: "Establishments 🏛️", value: "establishments" },
//   zoo: { label: "Zoos 🦁", value: "zoos" },
//   museum: { label: "Museums 🏛️", value: "museums" },
//   church: { label: "Churches ⛪", value: "churches" },
//   place_of_worship: { label: "Places of Worship 🙏", value: "places_of_worship" },
//   landmark: { label: "Landmarks 📸", value: "landmarks" },
//   food: { label: "Food 🍽️", value: "food" },
//   park: { label: "Parks & Outdoor 🌳", value: "parks" },
//   amusement_park: { label: "Amusement Parks 🎢", value: "amusement_parks" },
//   art_gallery: { label: "Art Galleries 🖼️", value: "art_galleries" },
//   restaurant: { label: "Restaurants 🍽️", value: "restaurants" },
//   bar: { label: "Bars & Pubs 🍻", value: "bars" },
// };

// // // Convert the object into an array
// const destinationOptions = Object.values(typeMappings);

export default function TripDetailsScreen() {
  const { user } = useAuth();
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
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
  const [preferenceSearch, setPreferenceSearch] = useState("");
  const [filteredPreferences, setFilteredPreferences] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isPreferenceModalVisible, setPreferenceModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [allPreferences, setAllPreferences] = useState([]);
  const [newStartDate, setNewStartDate] = useState(null);
  const [newEndDate, setNewEndDate] = useState(null);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [locationSelectionModalVisible, setLocationSelectionModalVisible] =
    useState(false);
  const [topLocations, setTopLocations] = useState([]);

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
  const locationTypes = useLocationTypes();

  const destinationOptions = locationTypes.types.map((type) => ({
    label: `${type}`,
    value: type,
  }));

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
      let r = await Location.reverseGeocodeAsync(location);
      if (r.length > 0) {
        const {
          name,
          city,
          region,
          country,
          streetNumber,
          street,
          postalCode,
        } = r[0];

        let locationName = name ?? "Unknown Location"; // Ensure a valid fallback
        if (streetNumber?.trim() && street?.trim()) {
          const locationName = `${streetNumber} ${street}, ${city}, ${region}, ${country}, ${postalCode}`;
        }
        // ✅ Save the selected participant's new location in Supabase
        const { error } = await supabase
          .from("tripParticipants")
          .update({
            startingLocation: locationName,
            latitude: location.latitude,
            longitude: location.longitude,
          })
          .eq("tripId", tripId)
          .eq("userId", selectedParticipant.id); // Ensure we update only this user

        if (!error) {
          fetchParticipants(); // Refresh data
          // Alert.alert(
          //   "Success",
          //   `Updated location for ${selectedParticipant.fullName}!`,
          // );

          Toast.show({
            type: "Success",
            text1: "Success",
            text2: "Updated location for ${selectedParticipant.fullName}!",
          });
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
      setNewStartDate(moment(data.startDate, "YYYY-MM-DDTHH:mm").toDate());
      setNewEndDate(moment(data.endDate, "YYYY-MM-DDTHH:mm").toDate());
      setBestLocation({
        bestLatitude: data.bestLatitude,
        bestLongitude: data.bestLongitude,
        bestAddress: data.bestAddress,
        bestPlaceId: data.bestPlaceId,
        bestPhotos: data.bestPhotos,
      });
      fetchParticipants();
    }
  }

  /** 📌 Save updated dates */
  const saveUpdatedDates = async () => {
    if (!newStartDate || !newEndDate) {
      Alert.alert("Error", "Please select valid start and end dates.");
      return;
    }

    try {
      // Format the dates as local time strings (e.g., "2025-03-25T08:00")
      const startDateString = moment(newStartDate).format("YYYY-MM-DDTHH:mm");
      const endDateString = moment(newEndDate).format("YYYY-MM-DDTHH:mm");

      const { error } = await supabase
        .from("trips")
        .update({
          startDate: startDateString, // Save as local time string
          endDate: endDateString, // Save as local time string
        })
        .eq("id", tripId);

      if (!error) {
        Alert.alert("Success", "Trip dates updated successfully!");
        fetchTripDetails(); // Refresh trip details
        setIsDateModalVisible(false); // Close modal
      } else {
        Alert.alert("Error", "Failed to update trip dates.");
      }
    } catch (error) {
      console.error("Error updating trip dates:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  /** 📌 Handle date change */
  const handleDateChange = (event, selectedDate, isStart) => {
    if (selectedDate) {
      if (isStart) {
        setNewStartDate(selectedDate);
      } else {
        setNewEndDate(selectedDate);
      }
    }
  };

  /** 📌 Fetch participants along with starting locations */
  async function fetchParticipants() {
    try {
      // Step 1: Get all user IDs and starting locations in the trip
      const { data: participantData, error: participantError } = await supabase
        .from("tripParticipants")
        .select("*")
        .eq("tripId", tripId);
      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setParticipants([]);
        return;
      }

      // Extract user IDs and their starting locations
      const userIdMap = participantData.reduce((acc, participant) => {
        acc[participant.userId] = participant.startingLocation;
        return acc;
      }, {});

      const userIds = Object.keys(userIdMap);

      // Step 2: Fetch user details (full_name) from the users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, fullName")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Step 3: Combine user details with their starting locations
      const participantsList = usersData.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        startingLocation:
          userIdMap[user.id] || "Click to choose starting location",
        latitude:
          participantData.find((p) => p.userId === user.id)?.latitude || null,
        longitude:
          participantData.find((p) => p.userId === user.id)?.longitude || null,
        preferences:
          participantData.find((p) => p.userId === user.id)?.preferences ||
          null,
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
    let response = await Location.reverseGeocodeAsync(selectedLocation);
    if (response.length > 0) {
      const { city, region, country, streetNumber, street, postalCode } =
        response[0];
      const locationName = `${streetNumber} ${street}, ${city}, ${region}, ${country}, ${postalCode}`;

      // ✅ Save the selected participant's new location in Supabase
      const { error } = await supabase
        .from("tripParticipants")
        .update({
          startingLocation: locationName,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        })
        .eq("tripId", tripId)
        .eq("userId", selectedParticipant.id); // Ensure we update only this user

      if (!error) {
        fetchParticipants(); // Refresh data
        Alert.alert(
          "Success",
          `Updated location for ${selectedParticipant.fullName}!`,
        );
      }
    }

    setMapModalVisible(false);
  };

  if (!trip) return null;

  async function handleFindBestLocation() {
    try {
      setLoading(true);
      setSearchStatus("Finding best location...");
      Animated.timing(progress, {
        toValue: 0, // Reset progress bar
        duration: 300,
        useNativeDriver: false,
      }).start();

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

      let locations = [];
      let bestLocation = null;
      let bestTravelTime = Infinity;

      // Sort and filter top 5 locations based on best travel time
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        const totalTime = await fetchTravelTimes(participants, candidate);
        const preferenceScore = calculatePreferenceScore(
          participants,
          candidate,
        );

        const adjustedScore = totalTime - preferenceScore * 100;

        if (adjustedScore < bestTravelTime) {
          bestTravelTime = adjustedScore;
          bestLocation = candidate;
        }

        // Collect the top 5 best locations
        if (i < 10) {
          locations.push(candidate);
        }
      }
      // Show the modal with the top locations
      setLocationSelectionModalVisible(true);
      setTopLocations(locations); // Set the top locations to be displayed in the modal
    } catch (error) {
      console.error("Error finding best location:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBestLocation(location) {
    if (!location) {
      Alert.alert("Error", "Could not determine the best location.");
      setLoading(false);
      return;
    }

    const photos_uri = extractPhotoUrls(location.photos);
    location.photos = photos_uri;
    setBestLocation(bestLocation);

    // Update database with the best location
    const { error } = await supabase
      .from("trips")
      .update({
        bestLocation: location.name,
        bestLatitude: location.latitude,
        bestLongitude: location.longitude,
        bestAddress: location.address,
        bestPlaceId: location.place_id,
        bestPhotos: photos_uri,
      })
      .eq("id", tripId);

    if (!error) {
      Toast.show({
        type: "Success",
        text1: "Success",
        text2: `Best location found: ${location.name}`,
      });
    }
    fetchTripDetails(); // Refresh data
  }

  function calculatePreferenceScore(participants, candidate) {
    let score = 0;
    participants.forEach((participant) => {
      if (participant.preferences) {
        const matchCount = participant.preferences.filter((pref) =>
          candidate.types.includes(pref),
        ).length;
        score += matchCount;
      }
    });
    return score;
  }

  async function fetchTripParticipants(tripId) {
    try {
      const { data, error } = await supabase
        .from("tripParticipants")
        .select("*")
        .eq("tripId", tripId)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching part:", error);
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
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=50000&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) return [];

      const detailedResults = await Promise.all(
        data.results.map(async (place) => {
          const details = await fetchPlaceDetails(place.place_id);
          return {
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.vicinity,
            place_id: place.place_id,
            photos: place.photos,
            types: place.types,
            opening_hours: details?.opening_hours || null, // Includes opening & closing times
          };
        }),
      );

      // const filteredResults = detailedResults.filter((place) => {
      //   if (!place.opening_hours) return false;
      //   return isOpenDuringTrip(
      //     place.opening_hours,
      //     trip?.startDate,
      //     trip?.endDate,
      //   );
      // });

      return detailedResults;
    } catch (error) {
      console.error("Error fetching candidate locations:", error);
      return [];
    }
  }

  async function fetchPlaceDetails(placeId) {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,opening_hours&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (!data.result) return null;

      return {
        name: data.result.name,
        opening_hours: data.result.opening_hours?.periods || null,
      };
    } catch (error) {
      console.error(`Error fetching details for place ID ${placeId}:`, error);
      return null;
    }
  }

  // Helper function to get the day of the week (0 - Sunday, 6 - Saturday)
  function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    return date.getDay(); // Returns a number: 0 for Sunday, 1 for Monday, etc.
  }

  // Helper function to get the time in minutes from a Date object
  function getTimeInMinutes(dateString) {
    const date = new Date(dateString);
    return date.getHours() * 60 + date.getMinutes();
  }

  function isOpenDuringTrip(openingHours, tripStart, tripEnd) {
    if (!tripStart || !tripEnd || !openingHours) return false;

    // Parse the trip start and end dates
    const tripStartDay = getDayOfWeek(tripStart); // Get the day of the week (0-6)
    const tripEndDay = getDayOfWeek(tripEnd); // Get the day of the week (0-6)

    // Get the time in minutes for trip start and end
    const tripStartTime = getTimeInMinutes(tripStart);
    const tripEndTime = getTimeInMinutes(tripEnd);

    return openingHours.some((period) => {
      const openEntry = openingHours.find(
        (p) => p.open?.day === period.open.day,
      );
      const closeEntry = openingHours.find(
        (p) => p.close?.day === period.open.day,
      );

      if (!openEntry || !closeEntry) return false;

      const openTime = parseTime(openEntry.open.time);
      const closeTime = parseTime(closeEntry.close.time);

      // console.log("tripStartDay:", tripStartDay, "tripEndDay:", tripEndDay);
      // console.log("period.open.day:", period.open.day, "period.close.day:", period.close.day);
      // console.log("Open Time:", openTime, "Close Time:", closeTime);
      // console.log("Trip Start:", tripStartTime, "Trip End:", tripEndTime);
      // console.log("Is Open?", period.open.day >= tripStartDay && period.close.day <= tripEndDay && openTime <= tripStartTime && closeTime >= tripEndTime);
      return (
        period.open.day >= tripStartDay &&
        period.close.day <= tripEndDay &&
        openTime <= tripStartTime &&
        closeTime >= tripEndTime
      );
    });
  }

  function parseTime(timeString) {
    // Convert "HHMM" format to minutes of the day (e.g., "0900" -> 540, "2230" -> 1350)
    const hours = parseInt(timeString.substring(0, 2), 10);
    const minutes = parseInt(timeString.substring(2, 4), 10);
    return hours * 60 + minutes;
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

  // 📌 Preference Filtering with Word Embeddings
  const handlePreferenceSearch = (text) => {
    setPreferenceSearch(text);
    const lowerText = text.toLowerCase();
    let matches = [];

    Object.keys(destinationCategories).forEach((category) => {
      if (
        destinationCategories[category].some((word) => lowerText.includes(word))
      ) {
        matches.push({ label: category, value: category });
      }
    });

    setFilteredPreferences(matches);
  };

  const handleSelectPreference = (category) => {
    if (!selectedPreferences.includes(category)) {
      setSelectedPreferences([...selectedPreferences, category]);
    }
  };

  const savePreferences = async () => {
    if (!selectedParticipant) return;
    setLoading(true);
    if (selectedPreferences) {
      const { error } = await supabase
        .from("tripParticipants")
        .update({ preferences: selectedPreferences }) // Ensure this is an array of strings
        .eq("tripId", tripId)
        .eq("userId", selectedParticipant.id);

      if (error) {
        Alert.alert("Failed", "Failed to update Preferences!");
      } else {
        fetchParticipants();
        Alert.alert("Success", "Preferences updated!");
      }

      setLoading(false);
      // setPreferenceModalVisible(false);
      setSelectedPreferences(null);
    } else {
      Alert.alert("Error", "Set preferences first");
      return;
    }
  };

  const startTrip = async () => {
    if (!trip?.bestLatitude || !trip?.bestLongitude) {
      Alert.alert(
        "Error",
        "Best location not found. Please find the best location first.",
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tripParticipants")
        .select("startingLocation, latitude, longitude")
        .eq("tripId", tripId)
        .eq("userId", user.id) // Fetch only for the current user
        .single();

      if (error) {
        console.error("Error fetching starting location:", error);
        return null;
      }

      console.log(
        "Starting location:",
        data.startingLocation,
        "Destination: ",
        trip.bestAddress,
      );
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(data.startingLocation)}&destination=${encodeURIComponent(trip.bestAddress)}&travelmode=driving`;
      Linking.openURL(googleMapsUrl);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching my location:", error);
      return null;
    }
  };

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
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <FontAwesome name="arrow-left" size={28} color="black" />
            </TouchableOpacity>
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
              uri: trip?.bestPhotos?.[0] || "https://via.placeholder.com/800",
            }}
            className="w-[95%] h-[50%] rounded-lg mx-4 mt-4"
          />
          <Text className="text-4xl font-bold p-6">
            {trip?.bestLocation || "Unknown Destination"}
          </Text>

          {/* 📌 Destination types */}
          <View className="flex-row flex-wrap px-6">
            {trip?.bestTypes?.map((type) => (
              <Text
                key={type}
                className="bg-gray-200 px-4 py-2 rounded-full m-1"
              >
                {type}
              </Text>
            ))}
          </View>

          {/* <View>
            {bestLocation.opening_hours && bestLocation.opening_hours.length > 0 ? (
              <View>
                {bestLocation.opening_hours.map((hours, index) => (
                  <Text key={index} className="text-gray-700">
                    {`Day ${index + 1}: Open - ${hours.open.time}, Close - ${hours.close.time}`}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="text-gray-500">No opening hours available</Text>
            )}
          </View> */}

          {/* 📌 Trip Details */}
          <View className="p-6 bg-white rounded-lg shadow-md mx-4 mt-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-semibold text-gray-900">
                📅 When
              </Text>
              <TouchableOpacity onPress={() => setIsDateModalVisible(true)}>
                <FontAwesome name="edit" size={20} color="orange" />
              </TouchableOpacity>
            </View>

            {/* Start Date */}
            <View className="flex-row justify-between items-center mt-4">
              <Text className="text-base text-gray-600">
                Start: {moment(newStartDate).format("MM/DD/YYYY - hh:mm A")}
              </Text>
            </View>

            {/* End Date */}
            <View className="flex-row justify-between items-center mt-4">
              <Text className="text-base text-gray-600">
                End: {moment(newEndDate).format("MM/DD/YYYY - hh:mm A")}
              </Text>
            </View>

            {/* 📌 Participants */}
            <Text className="text-lg font-semibold mt-4">Participants:</Text>
            <View className="flex-row flex-wrap mt-2">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <View
                    key={participant.id}
                    className="bg-orange-300 px-3 py-3 rounded-full m-1"
                  >
                    <Text className="text-sm">{participant.fullName}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">No participants yet</Text>
              )}
            </View>
          </View>

          {/* 📌 Date Editing Modal */}
          <Modal visible={isDateModalVisible} transparent animationType="slide">
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white w-[85%] rounded-2xl p-6 shadow-xl">
                <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Edit Trip Dates
                </Text>

                {/* Start Date Picker */}
                <Text className="text-lg font-semibold mb-2">
                  Start Date & Time
                </Text>
                <DateTimePicker
                  value={newStartDate || new Date()}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) =>
                    handleDateChange(event, selectedDate, true)
                  }
                />

                {/* End Date Picker */}
                <Text className="text-lg font-semibold mt-4 mb-2">
                  End Date & Time
                </Text>
                <DateTimePicker
                  value={newEndDate || new Date()}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) =>
                    handleDateChange(event, selectedDate, false)
                  }
                />

                {/* Save & Cancel Buttons */}
                <View className="flex-row justify-between mt-6">
                  <TouchableOpacity
                    className="bg-orange-500 py-3 w-[48%] rounded-xl shadow-lg"
                    onPress={saveUpdatedDates}
                  >
                    <Text className="text-white font-bold text-center text-lg">
                      Save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-gray-300 py-3 w-[48%] rounded-xl"
                    onPress={() => setIsDateModalVisible(false)}
                  >
                    <Text className="text-gray-800 font-bold text-center text-lg">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
          <Text className="text-2xl font-bold text-gray-900 px-6 mt-6">
            👥 Participants
          </Text>

          {participants.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white p-4 rounded-xl mx-4 my-2 shadow-md border border-gray-200"
              onPress={() => {
                setSelectedParticipant(item); // Store selected participant
                // setMapModalVisible(true); // Open the map picker modal
                setPreferenceModalVisible(true);
              }}
            >
              <Text className="text-lg font-bold text-gray-900">
                {item.fullName || "Unknown"}
              </Text>
              <Text className="text-sm text-gray-500">
                Preferences:{" "}
                {item.preferences.length > 0
                  ? item.preferences.join(", ")
                  : "Click to choose preferences"}
              </Text>
              <Text className="text-sm text-gray-500">
                {/* Starting Location: {item ? `${item?.startingLocation}` : "Click to choose preferences"} */}
                {item.startingLocation ? (
                  <Text>{`Location: ${item.startingLocation}`}</Text>
                ) : (
                  <Text>Loading location...</Text> // Or a fallback message
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 📌 Floating Action Buttons */}
        <View className="flex-row justify-around my-6 p-6">
          <TouchableOpacity
            className="bg-orange-500 px-6 py-3 rounded-full shadow-lg flex-row items-center"
            onPress={() => {
              if (!trip?.bestLocation) {
                Alert.alert("Error", "Find the best location first.");
                return;
              }
              router.push({
                pathname: "/map",
                params: {
                  bestLatitude: trip.bestLatitude,
                  bestLongitude: trip.bestLongitude,
                  participants: JSON.stringify(participants),
                },
              });
            }}
          >
            <FontAwesome name="map" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Show Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-orange-300 px-6 py-3 rounded-full shadow-lg flex-row items-center"
            onPress={startTrip}
          >
            <FontAwesome name="play" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-300 px-6 py-3 rounded-full shadow-lg flex-row items-center"
            onPress={handleFindBestLocation}
            disabled={loading}
          >
            {
              <>
                <FontAwesome name="location-arrow" size={20} color="gray" />
                <Text className="text-gray-800 font-bold ml-2">
                  Get Best Location
                </Text>
              </>
            }
          </TouchableOpacity>
        </View>

        {/* 📌 Destination Preferences Modal */}
        <Modal
          visible={isPreferenceModalVisible}
          transparent
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white w-[90%] rounded-3xl p-6 shadow-2xl">
              <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Choose Preferences
              </Text>

              <DropDownPicker
                open={openDropdown}
                value={selectedPreferences}
                items={destinationOptions}
                setOpen={setOpenDropdown}
                setValue={setSelectedPreferences}
                setItems={setAllPreferences}
                multiple={true}
                placeholder="Select preferences..."
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 12,
                  backgroundColor: "#f9f9f9",
                  paddingVertical: 12,
                }}
                dropDownContainerStyle={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 12,
                }}
              />

              <TouchableOpacity
                className="bg-orange-500 py-4 w-full rounded-2xl mt-6 shadow-md"
                onPress={savePreferences}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Save Preferences
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-orange-500 py-4 w-full rounded-2xl mt-4 shadow-md"
                onPress={() => {
                  setPreferenceModalVisible(false);
                  setMapModalVisible(true);
                }}
              >
                <Text className="text-white font-bold text-center text-lg">
                  {" "}
                  {selectedLocation
                    ? selectedLocation
                    : "Set Starting Location"}{" "}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-6"
                onPress={() => setPreferenceModalVisible(false)}
              >
                <Text className="text-gray-600 text-center text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 📌 Map Picker Modal */}
        <Modal visible={mapModalVisible} transparent animationType="slide">
          <View className="flex-1 bg-black/50 backdrop-blur-md justify-center items-center">
            <View className="w-[90%] h-[80%] bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* 📌 Header */}
              <Text className="text-lg font-bold text-gray-900 text-center my-4">
                Update Starting Location for {selectedParticipant?.fullName}
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
                    setPreferenceModalVisible(true);
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

        <Modal
          visible={locationSelectionModalVisible}
          transparent
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="max-h-[500px] bg-white w-[90%] rounded-3xl p-6 shadow-2xl">
              <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Choose a Destination
              </Text>
              <FlatList
                data={topLocations}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => {
                  const isOpen = isOpenDuringTrip(
                    item.opening_hours,
                    trip?.startDate,
                    trip?.endDate,
                  );
                  // console.log("Is the place open during the trip: ", isOpen? "Yes" : "No");
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        updateBestLocation(item);
                        setLocationSelectionModalVisible(false);
                      }}
                      className="bg-white rounded-lg shadow-lg mx-4 my-2 p-4 flex-row items-start space-x-4 border border-gray-200"
                    >
                      {/* Location Image */}
                      <Image
                        source={{
                          uri:
                            item.photos && item.photos[0]
                              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                              : "https://via.placeholder.com/150",
                        }}
                        className="w-20 h-20 rounded-lg"
                        style={{ resizeMode: "cover" }}
                      />

                      <View className="flex-1">
                        {/* Location Name */}
                        <Text className="text-lg font-semibold text-gray-900 mx-3">
                          {item.name}
                        </Text>

                        {/* Location Address */}
                        <Text className="text-sm text-gray-600 mt-1 mx-3">
                          {item.address}
                        </Text>

                        {/* Location Types */}
                        <View className="flex-row flex-wrap mt-2 mx-3">
                          {item.types.map((type, index) => (
                            <Text
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-2 mb-2"
                            >
                              {type}
                            </Text>
                          ))}
                        </View>

                        {/* Opening Hours */}
                        <View className="flex-row flex-wrap mt-2 mx-4">
                          {isOpen ? (
                            <Text className="text-xs text-green-600 font-medium">
                              Open During trip time
                            </Text>
                          ) : (
                            <Text className="text-xs text-red-600 font-medium">
                              Not Open During trip time
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Right Arrow Icon */}
                      <FontAwesome
                        name="chevron-right"
                        size={20}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                className="mt-6 bg-gray-300 py-3 w-full rounded-xl"
                onPress={() => setLocationSelectionModalVisible(false)}
              >
                <Text className="text-center text-lg font-bold text-gray-800">
                  Cancel
                </Text>
              </TouchableOpacity>
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
      {/* 📌 Loading Animation */}
      <LoadingOverlay
        visible={loading}
        type="dots"
        message="Finding best location..."
      />
    </View>
  );
}
