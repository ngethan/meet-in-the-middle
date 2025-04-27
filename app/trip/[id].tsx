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
import {
  ArrowLeft,
  UserCircle,
  Play,
  Navigation2,
  MapPin,
  ChevronRight,
  Search,
  Plus,
  X,
} from "lucide-react-native";
import moment from "moment";
import axios from "axios";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthProvider";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler"; // !!! need to replace PanGestureHandler with an alternative !!!
import LoadingOverlay from "../../components/loadingoverlay";
import DropDownPicker from "react-native-dropdown-picker";
import { LocationProvider, useLocationTypes } from "@/context/LocationProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "lucide-react-native";
import { Users } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

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

// Define Trip interface
interface Trip {
  id: string;
  name: string;
  bestLocation: string;
  bestLatitude: number;
  bestLongitude: number;
  bestAddress: string;
  bestPhotos: string[];
  bestTypes: string[];
  startDate: string;
  endDate: string;
}

export default function TripDetailsScreen() {
  const { user } = useAuth();
  const tripId = useLocalSearchParams().id;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<
    {
      id: string;
      fullName: string;
      startingLocation?: string;
      latitude?: number;
      longitude?: number;
      preferences?: string[];
    }[]
  >([]);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [bestLocation, setBestLocation] = useState<{
    bestLatitude: number;
    bestLongitude: number;
    bestAddress: string;
    bestPlaceId: string;
    bestPhotos?: string[];
    bestTypes?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingLocation, setStartingLocation] = useState(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [progress, setProgress] = useState(new Animated.Value(0)); // For progress animation
  const [searchStatus, setSearchStatus] = useState("Starting search...");
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [preferenceSearch, setPreferenceSearch] = useState("");
  const [filteredPreferences, setFilteredPreferences] = useState<any[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [preferenceModalVisible, setPreferenceModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [allPreferences, setAllPreferences] = useState<any[]>([]);
  const [locationSelectionModalVisible, setLocationSelectionModalVisible] =
    useState(false);
  const [topLocations, setTopLocations] = useState<any[]>([]);

  // Define destination categories for preference filtering
  const destinationCategories: Record<string, string[]> = {
    restaurant: [
      "food",
      "eat",
      "dining",
      "restaurant",
      "cafe",
      "café",
      "bistro",
    ],
    shopping: ["shop", "store", "mall", "retail", "boutique"],
    entertainment: [
      "entertainment",
      "fun",
      "activity",
      "attraction",
      "amusement",
    ],
    nightlife: ["bar", "club", "nightlife", "pub", "lounge"],
    outdoor: ["park", "outdoor", "nature", "hiking", "trail", "beach"],
    culture: ["museum", "gallery", "theater", "theatre", "cultural", "art"],
    sports: ["sports", "gym", "fitness", "stadium", "arena"],
  };
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  useEffect(() => {
    fetchTripDetails();
  }, []);

  function extractPhotoUrls(photos: any[]) {
    return photos.map(
      (photo: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`,
    );
  }
  const locationTypes = useLocationTypes();

  const destinationOptions = locationTypes.types.map((type) => ({
    label: `${type}`,
    value: type,
  }));

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
  const selectLocation = async (placeId: string) => {
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
          .eq("userId", selectedParticipant?.id); // Use optional chaining to safely access id

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
  const handleSelectLocation = (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
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

      const participants = await fetchTripParticipants(tripId as string);

      if (participants.length === 0) {
        Alert.alert("Error", "No participants with valid locations.");
        setLoading(false);
        return;
      }

      setSearchStatus("Computing midpoint...");
      const midpoint = computeMidpoint(participants);

      if (!midpoint) {
        Alert.alert(
          "Error",
          "Could not compute midpoint from participant locations.",
        );
        setLoading(false);
        return;
      }

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

  async function updateBestLocation(location: any) {
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

  function calculatePreferenceScore(participants: any[], candidate: any) {
    let score = 0;
    participants.forEach((participant) => {
      if (participant.preferences) {
        const matchCount = participant.preferences.filter((pref: string) =>
          candidate.types.includes(pref),
        ).length;
        score += matchCount;
      }
    });
    return score;
  }

  async function fetchTripParticipants(tripId: string) {
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

  function computeMidpoint(locations: any[]) {
    if (locations.length === 0) return null;

    let latSum = 0,
      lonSum = 0;

    locations.forEach(
      ({ latitude, longitude }: { latitude: number; longitude: number }) => {
        latSum += latitude;
        lonSum += longitude;
      },
    );

    return {
      latitude: latSum / locations.length,
      longitude: lonSum / locations.length,
    };
  }

  async function fetchCandidateLocations(midpoint: {
    latitude: number;
    longitude: number;
  }) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.latitude},${midpoint.longitude}&radius=50000&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) return [];

      const detailedResults = await Promise.all(
        data.results.map(async (place: any) => {
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

  async function fetchPlaceDetails(placeId: string) {
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
  function getDayOfWeek(dateString: string) {
    const date = new Date(dateString);
    return date.getDay(); // Returns a number: 0 for Sunday, 1 for Monday, etc.
  }

  // Helper function to get the time in minutes from a Date object
  function getTimeInMinutes(dateString: string) {
    const date = new Date(dateString);
    return date.getHours() * 60 + date.getMinutes();
  }

  function isOpenDuringTrip(
    openingHours: any[],
    tripStart: string,
    tripEnd: string,
  ) {
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

  function parseTime(timeString: string) {
    // Convert "HHMM" format to minutes of the day (e.g., "0900" -> 540, "2230" -> 1350)
    const hours = parseInt(timeString.substring(0, 2), 10);
    const minutes = parseInt(timeString.substring(2, 4), 10);
    return hours * 60 + minutes;
  }

  async function fetchTravelTimes(participants: any[], candidate: any) {
    const origins = participants
      .map((p: any) => `${p.latitude},${p.longitude}`)
      .join("|");
    const destination = `${candidate.latitude},${candidate.longitude}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!data.rows) return null;

      const totalTravelTime = data.rows.reduce((sum: number, row: any) => {
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

  async function findOptimalDestination(tripId: string) {
    const participants = await fetchTripParticipants(tripId);
    if (participants.length === 0) return null;

    const midpoint = computeMidpoint(participants);
    if (!midpoint) {
      Alert.alert(
        "Error",
        "Could not compute midpoint from participant locations.",
      );
      return null;
    }
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
  const handlePreferenceSearch = (text: string) => {
    setPreferenceSearch(text);
    const lowerText = text.toLowerCase();
    let matches: { label: string; value: string }[] = [];

    Object.keys(destinationCategories).forEach((category) => {
      if (
        destinationCategories[category].some((word) => lowerText.includes(word))
      ) {
        matches.push({ label: category, value: category });
      }
    });

    setFilteredPreferences(matches);
  };

  const handleSelectPreference = (category: string) => {
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
      setSelectedPreferences([]);
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
    <View className="flex-1 bg-gray-50">
      <GestureHandlerRootView className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 300 + 30 * participants.length,
          }}
          showsVerticalScrollIndicator={false}
          className="relative"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-16 bg-white shadow-md border-b border-gray-200">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-gray-100 rounded-full shadow-sm active:bg-gray-200"
            >
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-xl font text-gray-800">
              {trip?.name || "Loading trip..."}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Hero Image with Gradient Overlay */}
          <View className="relative w-full h-72 mt-2">
            <Image
              source={{
                uri: trip?.bestPhotos?.[0] || "https://via.placeholder.com/800",
              }}
              className="w-full h-full"
              style={{ borderRadius: 0 }}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "50%",
                borderRadius: 0,
              }}
            />
            <View className="absolute bottom-4 left-6">
              <Text className="text-3xl font-bold text-white mb-1 shadow-text">
                {trip?.bestLocation || "Discover Your Destination"}
              </Text>

              {/* Destination types */}
              <View className="flex-row flex-wrap mt-2">
                {trip?.bestTypes?.map((type) => (
                  <Text
                    key={type}
                    className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mr-2 mb-1 text-white text-xs font-medium"
                  >
                    {type}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Trip Details Card */}
          <View className="mx-4 -mt-6 bg-white rounded-2xl shadow-lg p-6 z-10 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                <Calendar size={20} color="#6366f1" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500 font-medium">When</Text>
                <Text className="text-base text-gray-800">
                  {trip?.startDate
                    ? moment(trip.startDate).format("MMM DD") +
                      " - " +
                      moment(trip.endDate).format("MMM DD, YYYY")
                    : "Date not set"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                <Users size={20} color="#8b5cf6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm text-gray-500 font-medium">
                  Who's coming
                </Text>
                <View className="flex-row flex-wrap mt-1">
                  {participants.length > 0 ? (
                    participants.map((participant, index) => (
                      <View
                        key={participant.id}
                        style={{
                          marginLeft: index > 0 ? -8 : 0,
                          zIndex: participants.length - index,
                        }}
                      >
                        <View className="w-8 h-8 rounded-full bg-blue-400 items-center justify-center border-2 border-white">
                          <Text className="text-xs font-bold text-white">
                            {participant.fullName?.charAt(0) || "?"}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500 text-sm">
                      No participants yet
                    </Text>
                  )}
                  {participants.length > 0 && (
                    <Text className="text-gray-600 text-sm ml-2 mt-1">
                      {participants.length}{" "}
                      {participants.length === 1 ? "person" : "people"}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Participants Section */}
          <View className="mt-6 px-4">
            <Text className="text-xl font-bold text-gray-800 mb-4 flex-row items-center">
              <Users size={20} color="#333" className="mr-2" /> Participants
            </Text>

            {participants.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white mb-3 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                onPress={() => {
                  setSelectedParticipant(item);
                  setPreferenceModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-blue-400 items-center justify-center">
                        <Text className="text-white font-bold">
                          {item.fullName?.charAt(0) || "?"}
                        </Text>
                      </View>
                      <Text className="text-lg font-semibold text-gray-800 ml-3">
                        {item.fullName || "Unknown"}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </View>

                  <View className="mt-2 ml-13">
                    {item.preferences && item.preferences.length > 0 ? (
                      <View className="flex-row flex-wrap">
                        {item.preferences.slice(0, 3).map((pref, idx) => (
                          <Text
                            key={idx}
                            className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                          >
                            {pref}
                          </Text>
                        ))}
                        {item.preferences.length > 3 && (
                          <Text className="text-gray-500 text-xs px-2 py-1">
                            +{item.preferences.length - 3} more
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text className="text-sm text-gray-500 italic">
                        Tap to set preferences
                      </Text>
                    )}

                    {item.startingLocation ? (
                      <Text className="text-sm text-gray-600 mt-1 flex-row items-center">
                        <MapPin size={12} color="#6b7280" className="mr-1" />
                        {item.startingLocation}
                      </Text>
                    ) : (
                      <Text className="text-sm text-gray-500 mt-1 italic">
                        <MapPin size={12} color="#9ca3af" className="mr-1" />
                        No starting location set
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-indigo-600 px-4 py-3 rounded-xl shadow-md flex-row items-center justify-center flex-1 mr-2"
              onPress={handleFindBestLocation}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Navigation2 size={18} color="white" />
              <Text className="text-white font-bold ml-2">
                Find Best Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-purple-600 px-4 py-3 rounded-xl shadow-md flex-row items-center justify-center flex-1 ml-2"
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
              activeOpacity={0.8}
            >
              <MapPin size={18} color="white" />
              <Text className="text-white font-bold ml-2">Show Routes</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-purple-400 mt-3 py-4 rounded-xl shadow-md flex-row items-center justify-center"
            onPress={startTrip}
            activeOpacity={0.8}
          >
            <Play size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Start Trip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Modal */}
        <Modal
          visible={preferenceModalVisible}
          transparent
          animationType="slide"
        >
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark">
            <View className="flex-1 justify-end">
              <View className="bg-white rounded-t-3xl p-6 shadow-2xl">
                <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedParticipant?.fullName}'s Preferences
                </Text>
                <Text className="text-gray-500 mb-6">
                  Choose what you're interested in for this trip
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
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    backgroundColor: "#f9fafb",
                    paddingVertical: 14,
                  }}
                  textStyle={{
                    fontSize: 16,
                    color: "#4b5563",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                  selectedItemContainerStyle={{
                    backgroundColor: "#ede9fe",
                  }}
                  selectedItemLabelStyle={{
                    color: "#6d28d9",
                    fontWeight: "bold",
                  }}
                />

                <TouchableOpacity
                  className="bg-blue-500 py-4 w-full rounded-xl mt-6 shadow-md"
                  onPress={savePreferences}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-center text-lg">
                    Save Preferences
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-blue-500 py-4 w-full rounded-xl mt-4 shadow-md"
                  onPress={() => {
                    setPreferenceModalVisible(false);
                    setMapModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-center text-lg">
                    {typeof selectedLocation === "object"
                      ? "Location Selected"
                      : selectedLocation || "Set Starting Location"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-4 mt-4"
                  onPress={() => setPreferenceModalVisible(false)}
                >
                  <Text className="text-gray-600 text-center text-lg font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
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
                className="bg-blue-500 px-4 py-3 mx-4 my-2 rounded-lg shadow-lg"
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
                  className="bg-blue-500 py-3 w-[48%] rounded-xl shadow-lg"
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

        {/* Location Selection Modal */}
        <Modal
          visible={locationSelectionModalVisible}
          transparent
          animationType="slide"
        >
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark">
            <View className="flex-1 justify-center items-center">
              <View className="w-[90%] max-h-[80%] bg-white rounded-3xl shadow-2xl overflow-hidden">
                <View className="p-6 border-b border-gray-100">
                  <Text className="text-2xl font-bold text-gray-900 text-center">
                    Choose Your Destination
                  </Text>
                  <Text className="text-gray-500 text-center mt-1">
                    Select the best place for your trip
                  </Text>
                </View>

                <FlatList
                  data={topLocations}
                  keyExtractor={(item) => item.place_id}
                  contentContainerStyle={{ padding: 12 }}
                  renderItem={({ item }) => {
                    const isOpen = isOpenDuringTrip(
                      item.opening_hours,
                      trip?.startDate,
                      trip?.endDate,
                    );
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          updateBestLocation(item);
                          setLocationSelectionModalVisible(false);
                        }}
                        className="bg-white rounded-xl shadow-sm mb-3 border border-gray-100 overflow-hidden active:bg-gray-50"
                      >
                        <View className="flex-row">
                          {/* Location Image */}
                          <Image
                            source={{
                              uri:
                                item.photos && item.photos[0]
                                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                                  : "https://via.placeholder.com/150",
                            }}
                            className="w-24 h-full"
                            style={{ resizeMode: "cover" }}
                          />

                          <View className="flex-1 p-3">
                            <View className="flex-row justify-between items-start">
                              <Text className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                                {item.name}
                              </Text>
                              <ChevronRight size={20} color="#9ca3af" />
                            </View>

                            <Text className="text-sm text-gray-600 mt-1 flex-row items-center">
                              <MapPin
                                size={12}
                                color="#6b7280"
                                className="mr-1"
                              />
                              {item.address}
                            </Text>

                            {/* Location Types */}
                            <View className="flex-row flex-wrap mt-2">
                              {item.types
                                .slice(0, 3)
                                .map((type: string, index: number) => (
                                  <Text
                                    key={index}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-1 mb-1"
                                  >
                                    {type}
                                  </Text>
                                ))}
                              {item.types.length > 3 && (
                                <Text className="text-xs text-gray-500 px-1">
                                  +{item.types.length - 3}
                                </Text>
                              )}
                            </View>

                            {/* Opening Status */}
                            <View className="mt-1">
                              {isOpen ? (
                                <Text className="text-xs text-green-600 font-medium">
                                  ● Open during your trip
                                </Text>
                              ) : (
                                <Text className="text-xs text-red-600 font-medium">
                                  ● Closed during your trip
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />

                <View className="p-4 border-t border-gray-100">
                  <TouchableOpacity
                    className="bg-gray-200 py-3 rounded-xl"
                    onPress={() => setLocationSelectionModalVisible(false)}
                  >
                    <Text className="text-center text-gray-800 font-bold text-lg">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Search Overlay */}
        <Modal animationType="slide" visible={isOverlayVisible} transparent>
          <View className="flex-1 bg-black/30">
            <PanGestureHandler
              onGestureEvent={(e) => {
                if (e.nativeEvent.translationY > 100) setOverlayVisible(false);
              }}
            >
              <View className="w-full h-[70%] bg-white rounded-t-3xl p-6 shadow-xl mt-auto">
                {/* Drag Indicator */}
                <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Search Location
                </Text>

                {/* Search Input */}
                <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-200">
                  <Search size={20} color="#6b7280" />
                  <TextInput
                    className="flex-1 ml-2 text-gray-800 text-base"
                    placeholder="Search for a location..."
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={(text) => {
                      setSearchText(text);
                      searchLocation(text);
                    }}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                      <X size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Results List */}
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setOverlayVisible(false);
                        selectLocation(item.place_id);
                        setSearchText("");
                      }}
                      className="py-3 px-2 border-b border-gray-100 flex-row items-center"
                      activeOpacity={0.7}
                    >
                      <MapPin size={18} color="#6b7280" className="mr-3" />
                      <Text className="text-gray-800 flex-1">
                        {item.description}
                      </Text>
                      <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    searchText.length > 0 ? (
                      <View className="py-8 items-center">
                        <Text className="text-gray-500 text-center">
                          No results found. Try a different search.
                        </Text>
                      </View>
                    ) : null
                  }
                />
              </View>
            </PanGestureHandler>
          </View>
        </Modal>
      </GestureHandlerRootView>

      {/* Loading Animation */}
      <LoadingOverlay
        visible={loading}
        type="dots"
        message="Finding the perfect spot for everyone..."
      />
    </View>
  );
}
