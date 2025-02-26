import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import axios from "axios";
import { useAuth } from "@/context/AuthProvider";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

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
  const [_, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const fetchPopularDestinations = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission Denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
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

      results = results.map((place) => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude,
        ),
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
      } catch (error) {
        console.error("Error fetching location:", error);
        setErrorMsg("Error fetching location");
      }
    }

    getCurrentLocation();
    fetchPopularDestinations();
  }, []);

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
      <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-16 bg-white shadow-md">
        <TouchableOpacity onPress={toggleDrawer}>
          <FontAwesome name="bars" size={32} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">
          {currentLocation}
        </Text>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <FontAwesome name="user-circle" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      <FlatList
        data={places}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mt-5 bg-white rounded-2xl shadow-lg overflow-hidden mx-5"
            activeOpacity={0.8}
            onPress={() => router.push(`/place/${item.id}`)}
          >
            <Image source={{ uri: item.image }} className="w-full h-60" />
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

      {/* Floating Action Button */}
      <TouchableOpacity className="absolute bottom-40 right-6 bg-orange-500 w-16 h-16 rounded-full justify-center items-center shadow-lg">
        <FontAwesome name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
