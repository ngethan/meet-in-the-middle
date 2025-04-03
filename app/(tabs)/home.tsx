// Search bar and filter for popular destinations

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import axios from "axios";
import { SearchBar } from "@rneui/themed";
import { useAuth } from "@/context/AuthProvider";
import * as Location from "expo-location";
import LoadingOverlay from "../loadingoverlay";
import { useLocationTypes } from "@/context/LocationProvider";

import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Menu, User2Icon, UserCircle2Icon } from "lucide-react-native";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const RADIUS = 50000;

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState(null);
  const [places, setPlaces] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchLocationText, setSearchLocationText] = useState("");
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();
  const router = useRouter();

  const preferenceOptions = useLocationTypes().types; // Get location types from context

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false);

  // Toggle the visibility of the preferences dropdown
  const togglePreferenceDropdown = () => {
    setIsPreferenceOpen(!isPreferenceOpen);
  };

  // Handle selection and deselection of preferences
  const handlePreferenceChange = (preference: string) => {
    setSelectedPreferences((prevPreferences) => {
      if (prevPreferences.includes(preference)) {
        // Remove preference if already selected
        return prevPreferences.filter((item) => item !== preference);
      } else {
        // Add preference if not already selected
        return [...prevPreferences, preference];
      }
    });
  };

  const fetchPopularDestinations = async (
    lat: number,
    lon: number,
    query: string,
    selectedPreferences: string[],
  ) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lon}`,
            radius: RADIUS,
            type: "tourist_attraction",
            key: GOOGLE_MAPS_API_KEY,
          },
        },
      );

      let results = response.data.results.map((place) => ({
        id: place.place_id,
        title: place.name,
        description: place.vicinity || "Popular place nearby.",
        image: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : "https://via.placeholder.com/400",
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        icon: place.icon,
        reviews: place.reviews,
        types: place.types,
      }));

      // Real-time filtering based on search text
      if (query) {
        results = results.filter((place) =>
          place.title.toLowerCase().includes(query.toLowerCase()),
        );
      }
      if (selectedPreferences.length > 0) {
        results = results.filter((place) =>
          place.types.some((type) => selectedPreferences.includes(type)),
        );
      }

      results = results.map((place) => ({
        ...place,
        distance: calculateDistance(lat, lon, place.latitude, place.longitude),
      }));

      results.sort((a, b) => a.distance - b.distance);
      setPlaces(results);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        let geoAddress = await Location.reverseGeocodeAsync(location.coords);
        if (geoAddress.length > 0) {
          setAddress(geoAddress[0]);
        }

        fetchPopularDestinations(
          location.coords.latitude,
          location.coords.longitude,
          searchText,
          selectedPreferences,
        );
      } catch (error) {
        console.error("Error fetching location:", error);
        setErrorMsg("Error fetching location");
      }
    }

    getCurrentLocation();
  }, [searchText]);

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

  const changeLocation = async (location) => {
    let response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: location.place_id,
          key: GOOGLE_MAPS_API_KEY,
        },
      },
    );
    let lat = response.data.result.geometry.location.lat;
    let lon = response.data.result.geometry.location.lng;

    let geoAddress = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });

    if (geoAddress.length > 0) {
      setAddress(geoAddress[0]);
    }

    fetchPopularDestinations(lat, lon, searchText, selectedPreferences);
  };

  let currentLocation = "Waiting...";
  if (errorMsg) {
    currentLocation = errorMsg;
  } else if (location) {
    currentLocation = address
      ? `${address.city}, ${address.region}, ${address.country}`
      : "Unknown location";
  }

  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const toRadians = (deg: any) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-blue-400 shadow-md">
        <TouchableOpacity onPress={toggleDrawer}>
          <Menu size={32} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setOverlayVisible(true);
          }}
        >
          <Text className="text-lg font-bold text-gray-800">
            {currentLocation}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/profile")}>
          <UserCircle2Icon strokeWidth={1.5} size={32} color="black" />
        </TouchableOpacity>
      </View>

      <SearchBar
        placeholder="Search for a place..."
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          fetchPopularDestinations(
            location?.coords.latitude ?? 0,
            location?.coords.longitude ?? 0,
            text,
            selectedPreferences,
          );
        }}
        containerStyle={{
          backgroundColor: "#ffffff",
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 5,
        }}
        inputContainerStyle={{
          backgroundColor: "#f4f4f4",
          borderRadius: 10,
          paddingHorizontal: 12,
        }}
        inputStyle={{
          color: "#333",
          fontSize: 16,
        }}
        placeholderTextColor="#999"
        leftIconContainerStyle={{
          paddingLeft: 10,
        }}
        rightIconContainerStyle={{
          paddingRight: 10,
        }}
        round={true}
        lightTheme
        showCancel={false}
      />

      <FlatList
        data={places}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mt-5 bg-white rounded-2xl shadow-lg overflow-hidden mx-5"
            activeOpacity={0.8}
            onPress={() => router.push(`/place/${item.id}`)}
          >
            <Image source={{ uri: item.image }} className="w-full h-80" />
            <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <Text className="text-white text-xl font-bold">{item.title}</Text>
              <Text className="text-yellow-300 font-semibold">
                {item.distance} km
              </Text>
            </View>
            <Image
              source={{ uri: item.icon }}
              className="w-12 h-12 absolute top-3 right-3"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
      <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

      {/* 📌 Overlay Modal for Searching Locations */}
      <GestureHandlerRootView className="flex-1">
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
                  value={searchLocationText}
                  onChangeText={(text) => {
                    setSearchLocationText(text);
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
                        changeLocation(item);
                        setSearchLocationText(""); // Clear search text
                        setOverlayVisible(false); // Close modal after selection
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
        message="Loading popular destinations..."
      />
    </View>
  );
}
