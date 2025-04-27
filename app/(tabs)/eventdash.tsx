import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  Menu,
  MapPin,
  UserCircle,
  ArrowLeft,
  ChevronDown,
  UserCircle2Icon,
  Calendar,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import axios from "axios";
import { useAuth } from "@/context/AuthProvider";
import * as Location from "expo-location";
import LoadingOverlay from "../../components/loadingoverlay";
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import moment from "moment";
import { Search, X } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const RADIUS = 50000;

export default function EventDashBoard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] =
    useState<Location.LocationGeocodedAddress | null>(null);
  const [events, setEvents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();

  const TICKETMASTER_API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_API_KEY;

  const fetchEvents = async (lat: number, lon: number) => {
    try {
      setLoading(true); // Show loading overlay
      const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json`,
        {
          params: {
            latlong: `${lat},${lon}`,
            radius: RADIUS / 1000, // Convert radius to kilometers (Ticketmaster uses km)
            unit: "km", // Unit of distance
            apikey: TICKETMASTER_API_KEY,
          },
        },
      );

      // Mapping data from Ticketmaster response to a similar format as your existing places data
      const events = response.data._embedded.events.map((event: any) => ({
        id: event.id,
        title: event.name,
        description:
          event.classifications[0]?.segment.name || "No description available",
        image: event.images[0]?.url || "https://via.placeholder.com/400",
        latitude: event._embedded.venues[0]?.location.latitude || 0,
        longitude: event._embedded.venues[0]?.location.longitude || 0,
        venue: event._embedded.venues[0]?.name || "Unknown Venue",
        date: event.dates.start.localDate,
        time: event.dates.start.localTime,
        eventTime: moment(
          `${event.dates.start.localDate} ${event.dates.start.localTime}`,
          "YYYY-MM-DD HH:mm",
        ), // Convert to moment object
      }));

      // Sort events by time
      const sortedEvents = events.sort(
        (a: any, b: any) => a.eventTime - b.eventTime,
      );

      setEvents(sortedEvents); // Set sorted events
    } catch (error) {
      console.log(error);
      if (error == "[TypeError: Cannot read property 'events' of undefined]")
        console.error("There are no events fetched at this location");
      else
        console.error(
          "There are no events fetched at this location, please choose somewhere in America",
        );
    } finally {
      setOverlayVisible(false); // Close overlay modal
      setLoading(false); // Hide loading overlay
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
        setLoading(true);
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        let geoAddress = await Location.reverseGeocodeAsync(location.coords);
        if (geoAddress.length > 0) {
          setAddress(geoAddress[0]);
        }

        // Fetch events around the location
        fetchEvents(location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.error("Error fetching location:", error);
        setErrorMsg("Error fetching location");
        setLoading(false);
      }
    }

    getCurrentLocation();
  }, []);

  // Search new starting location
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
      setOverlayVisible(false); // Close overlay modal
      setLoading(false); // Hide loading overlay
      console.log(1);
      console.error("Error fetching events:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const changeLocation = async (location: any) => {
    try {
      setLoading(true);
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

      fetchEvents(lat, lon);
    } catch (error) {
      console.error("Error changing location:", error);
      setLoading(false);
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
    <View className="flex-1 bg-gray-50">
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
      {/* Event List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4 font-medium">
            Discovering events nearby...
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mt-4 bg-white rounded-3xl shadow-lg overflow-hidden mx-4 mb-3 border border-gray-100"
              activeOpacity={0.7}
              onPress={() => router.push(`/event/${item.id}`)}
            >
              <View className="relative">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-80"
                  resizeMode="cover"
                />
                <View className="absolute top-4 right-4 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <Text className="text-white font-semibold">{item.date}</Text>
                </View>
              </View>
              <View className="p-4">
                {/* Event Title */}
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {item.title}
                </Text>

                {/* Event Details & Action Button */}
                <View className="flex-row justify-between items-center mt-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                      <Calendar size={18} color="#3b82f6" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-500 text-xs">Date</Text>
                      <Text className="text-gray-800 font-medium">
                        {item.date}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 rounded-xl shadow-sm"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/event/${item.id}`);
                    }}
                  >
                    {/* Distance Badge */}
                    {location && item.latitude && item.longitude && (
                      <View className="flex-row items-center bg-blue-50 self-start px-3 py-1.5 rounded-full mb-3">
                        <MapPin size={14} color="#3b82f6" />
                        <Text className="text-blue-700 font-medium ml-1">
                          {calculateDistance(
                            location.coords.latitude,
                            location.coords.longitude,
                            item.latitude,
                            item.longitude,
                          )}{" "}
                          km away
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-lg">
                No events found nearby
              </Text>
              <TouchableOpacity
                className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
                onPress={() => setOverlayVisible(true)}
              >
                <Text className="text-white font-semibold">
                  Change Location
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

      {/* Location Search Modal */}
      <GestureHandlerRootView className="flex-1">
        <Modal animationType="slide" visible={isOverlayVisible} transparent>
          <View className="flex-1 justify-end bg-black/50">
            <PanGestureHandler
              onGestureEvent={(e) => {
                if (e.nativeEvent.translationY > 100) setOverlayVisible(false);
              }}
            >
              <View className="w-full h-[70%] bg-white rounded-t-3xl p-6 shadow-xl">
                {/* Drag Indicator */}
                <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Change Location
                </Text>
                <Text className="text-gray-500 mb-4">
                  Search for events in a different area
                </Text>

                {/* Search Input */}
                <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-xl mb-4 border border-gray-200">
                  <Search size={20} color="#9ca3af" className="mr-2" />
                  <TextInput
                    className="flex-1 text-gray-800 text-base"
                    placeholder="Search for location..."
                    value={searchText}
                    onChangeText={(text) => {
                      setSearchText(text);
                      searchLocation(text);
                    }}
                    placeholderTextColor="#9ca3af"
                  />
                  {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText("")}>
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
                  keyExtractor={(item: any) => item.place_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        changeLocation(item);
                        setSearchText("");
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
                    searchText && !isSearching ? (
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
