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
} from "react-native";
import {
  Menu,
  MapPin,
  UserCircle,
  ArrowLeft,
  ChevronDown,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import axios from "axios";
import { useAuth } from "@/context/AuthProvider";
import * as Location from "expo-location";
import LoadingOverlay from "../loadingoverlay";
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import moment from "moment";

const { width, height } = Dimensions.get("window");

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const RADIUS = 50000;

export default function EventDashBoard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState(null);
  const [events, setEvents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, signOut } = useAuth();
  const router = useRouter();

  const TICKETMASTER_API_KEY = "e48QyQe8dYPBlcGspizf6dtnvpGfDojV"; // Replace with your Ticketmaster API key

  const fetchEvents = async (lat: number, lon: number) => {
    console.log("latitude: ", lat, "longitude: ", lon);
    try {
      // setLoading(true); // Show loading overlay
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
      const events = response.data._embedded.events.map((event) => ({
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
      const sortedEvents = events.sort((a, b) => a.eventTime - b.eventTime);

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
      }
    }

    getCurrentLocation();
  }, []);

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
      setOverlayVisible(false); // Close overlay modal
      setLoading(false); // Hide loading overlay
      console.log(1);
      console.error("Error fetching events:", error);
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

    fetchEvents(lat, lon);
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
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-16 bg-orange-400 shadow-md">
        <TouchableOpacity onPress={toggleDrawer}>
          <Menu size={32} color="black" />
        </TouchableOpacity>

        {/* Clickable Location Text */}
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
          <UserCircle size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Event List */}
      <FlatList
        data={events}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mt-5 bg-white rounded-2xl shadow-lg overflow-hidden mx-5"
            activeOpacity={0.8}
            onPress={() => router.push(`/event/${item.id}`)} // Route to event detail page
          >
            <Image source={{ uri: item.image }} className="w-full h-80" />
            <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <Text className="text-white text-xl font-bold">{item.title}</Text>
              <Text className="text-yellow-300 font-semibold">{item.date}</Text>
            </View>
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
                        changeLocation(item);
                        setSearchText(""); // Clear search text
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
        message="Loading Events..."
      />
    </View>
  );
}
