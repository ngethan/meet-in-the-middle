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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import axios from "axios";
import { SearchBar } from "@rneui/themed";
import { useAuth } from "@/context/AuthProvider";
import * as Location from "expo-location";
import LoadingOverlay from "../../components/loadingoverlay";
import { useLocationTypes } from "@/context/LocationProvider";
import { MapPin, Search, X, Filter } from "lucide-react-native";

import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Menu,
  User2Icon,
  UserCircle2Icon,
  ChevronDown,
} from "lucide-react-native";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const RADIUS = 50000; // 50 km

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] =
    useState<Location.LocationGeocodedAddress | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchLocationText, setSearchLocationText] = useState("");
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSearchLocation, setCurrentSearchLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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
      setIsSearching(true);
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
      console.log(response.data.results[0].photos);

      let results = response.data.results.map((place: any) => ({
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
        results = results.filter((place: any) =>
          place.title.toLowerCase().includes(query.toLowerCase()),
        );
      }

      if (selectedPreferences.length > 0) {
        results = results.filter((place: any) =>
          place.types.some((type: any) => selectedPreferences.includes(type)),
        );
      }

      results = results.map((place: any) => ({
        ...place,
        distance: calculateDistance(lat, lon, place.latitude, place.longitude),
      }));

      results.sort((a: any, b: any) => a.distance - b.distance);
      setPlaces(results);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
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
        setCurrentSearchLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });

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

    if (!currentSearchLocation) {
      getCurrentLocation();
    } else {
      fetchPopularDestinations(
        currentSearchLocation.lat,
        currentSearchLocation.lon,
        searchText,
        selectedPreferences,
      );
    }
  }, [searchText, selectedPreferences]);

  const searchLocation = async (text: string) => {
    try {
      setIsSearching(true);
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
    } finally {
      setIsSearching(false);
    }
  };

  const changeLocation = async (location: any) => {
    try {
      setIsSearching(true);
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

      // Update location state with new coordinates
      setLocation({
        coords: {
          latitude: lat,
          longitude: lon,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      // Store current search location
      setCurrentSearchLocation({ lat, lon });
      fetchPopularDestinations(lat, lon, searchText, selectedPreferences);
    } catch (error) {
      console.error("Error changing location:", error);
    } finally {
      setIsSearching(false);
    }
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
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity
          onPress={toggleDrawer}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center active:bg-gray-100"
        >
          <Menu size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setOverlayVisible(true)}
          className="flex-row items-center bg-gray-50 px-3 py-2 rounded-full active:bg-gray-100"
        >
          <MapPin size={16} color="#3b82f6" className="mr-2" />
          <Text className="text-gray-800 font-medium mr-1" numberOfLines={1}>
            {currentLocation}
          </Text>
          <ChevronDown size={16} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center active:bg-gray-100"
        >
          <UserCircle2Icon size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 pt-4">
        <SearchBar
          placeholder="Search for a place..."
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            if (currentSearchLocation) {
              fetchPopularDestinations(
                currentSearchLocation.lat,
                currentSearchLocation.lon,
                text,
                selectedPreferences,
              );
            }
          }}
          containerStyle={{
            backgroundColor: "transparent",
            borderTopWidth: 0,
            borderBottomWidth: 0,
            paddingHorizontal: 0,
            marginBottom: 10,
          }}
          inputContainerStyle={{
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            height: 50,
          }}
          inputStyle={{
            fontSize: 16,
            color: "#374151",
          }}
          searchIcon={{ size: 22, color: "#3b82f6" }}
          clearIcon={{ size: 18, color: "#9ca3af" }}
          placeholderTextColor="#9ca3af"
          round={true}
          lightTheme
          showCancel={false}
          showLoading={isSearching}
        />
      </View>

      {/* Filter Section */}
      <View className="px-4 mb-2">
        <TouchableOpacity
          onPress={togglePreferenceDropdown}
          className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 active:bg-gray-100"
        >
          <View className="flex-row items-center">
            <Filter size={18} color="#3b82f6" className="mr-2" />
            <Text className="text-gray-700 font-medium">
              {selectedPreferences.length
                ? `${selectedPreferences.length} filters selected`
                : "Filter by type"}
            </Text>
          </View>
          <ChevronDown
            size={18}
            color="#3b82f6"
            style={{
              transform: [{ rotate: isPreferenceOpen ? "180deg" : "0deg" }],
            }}
          />
        </TouchableOpacity>

        {isPreferenceOpen && (
          <View className="bg-white mt-2 rounded-xl shadow-sm p-3 border border-gray-100">
            <ScrollView className="max-h-40">
              {preferenceOptions.map((preference) => (
                <TouchableOpacity
                  key={preference}
                  onPress={() => handlePreferenceChange(preference)}
                  className="flex-row items-center py-2.5 px-1 active:bg-gray-50 rounded-lg"
                >
                  <View
                    className={`w-5 h-5 rounded-md ${
                      selectedPreferences.includes(preference)
                        ? "bg-blue-500"
                        : "border border-gray-300"
                    } mr-3 items-center justify-center`}
                  >
                    {selectedPreferences.includes(preference) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <Text className="text-gray-700 capitalize">
                    {preference.replace(/_/g, " ").toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Places List */}
      {isSearching && places.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4">Searching places...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mx-4 mb-5 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 active:opacity-90"
              onPress={() => router.push(`/place/${item.id}`)}
            >
              <Image
                source={{ uri: item.image }}
                className="w-full h-64"
                resizeMode="cover"
              />
              <View className="absolute top-3 right-3 rounded-full p-1">
                <Image source={{ uri: item.icon }} className="w-8 h-8" />
              </View>
              <View className="p-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-gray-800">
                    {item.title}
                  </Text>
                  <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-full">
                    <MapPin size={12} color="#3b82f6" />
                    <Text className="text-blue-500 font-medium ml-1 text-xs">
                      {item.distance} km
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 mt-1" numberOfLines={2}>
                  {item.description || "Explore this amazing destination"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500">No places found</Text>
            </View>
          }
        />
      )}

      <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

      {/* Location Search Modal */}
      <GestureHandlerRootView className="flex-1">
        <Modal animationType="slide" visible={isOverlayVisible} transparent>
          <View className="flex-1 justify-end bg-black/40">
            <PanGestureHandler
              onGestureEvent={(e) => {
                if (e.nativeEvent.translationY > 100) setOverlayVisible(false);
              }}
            >
              <View className="w-full h-[70%] bg-white rounded-t-3xl p-6 shadow-xl">
                {/* Drag Indicator */}
                <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                <Text className="text-xl font-bold text-gray-800 mb-4">
                  Change Location
                </Text>

                {/* Search Input */}
                <View className="flex-row items-center bg-gray-50 px-4 rounded-xl border border-gray-200 mb-4">
                  <Search size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 p-3 text-gray-700"
                    placeholder="Search for location..."
                    value={searchLocationText}
                    onChangeText={(text) => {
                      setSearchLocationText(text);
                      searchLocation(text);
                    }}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchLocationText ? (
                    <TouchableOpacity onPress={() => setSearchLocationText("")}>
                      <X size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                  {isSearching && (
                    <ActivityIndicator
                      size="small"
                      color="#3b82f6"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>

                {/* Search Results List */}
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        changeLocation(item);
                        setSearchLocationText("");
                        setOverlayVisible(false);
                      }}
                      className="py-3 px-2 border-b border-gray-100 active:bg-gray-50 rounded-lg"
                    >
                      <View className="flex-row items-center">
                        <MapPin size={16} color="#3b82f6" className="mr-3" />
                        <Text className="text-gray-800">
                          {item.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    searchLocationText && !isSearching ? (
                      <View className="items-center py-8">
                        <Text className="text-gray-500">
                          No locations found
                        </Text>
                      </View>
                    ) : isSearching ? (
                      <View className="items-center py-8">
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <Text className="text-gray-500 mt-2">
                          Searching locations...
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
    </View>
  );
}
