import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationDrawer from "../components/Drawer";
import axios from "axios";
import { useAuth } from "@/context/AuthProvider";

import * as Location from "expo-location";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const RADIUS = 50000; // 50 km

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] =
    useState<Location.LocationGeocodedAddress | null>(null);
  const [places, setPlaces] = useState([]);
  const [_, setLoading] = useState(true);

  const fetchPopularDestinations = async () => {
    // Request location permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission Denied");
      return;
    }

    // Get the user's current location
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      // Google Places API request
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: RADIUS,
            type: "tourist_attraction", // Can be "restaurant", "museum", "hotel", etc.
            key: GOOGLE_MAPS_API_KEY,
          },
        },
      );

      // Extract useful information from response
      let results = response.data.results.map((place: any) => ({
        id: place.place_id,
        title: place.name,
        description: place.vicinity || "Popular place nearby.",
        image: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : "https://via.placeholder.com/400", // Default image if no photo available
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        icon: place.icon,
        reviews: place.reviews,
        types: place.types,
      }));
      // Calculate distance from current location
      results = results.map((place) => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude,
        ),
      }));

      // Sort places by closest distance
      results.sort((a, b) => a.distance - b.distance);

      setPlaces(results);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  };

  const { user, signOut } = useAuth();
  const router = useRouter();

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

        // Reverse geocode to get city, state, and country
        let geoAddress = await Location.reverseGeocodeAsync(location.coords);
        if (geoAddress.length > 0) {
          setAddress(geoAddress[0]); // Get the first result
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

  // Function to calculate the distance using the Haversine formula
  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const toRadians = (deg: any) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); // Distance in km
  };

  return (
    <View style={styles.container}>
      <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <FontAwesome name="bars" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}> {currentLocation}</Text>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <FontAwesome name="user-circle" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              style={styles.tripContainer}
              activeOpacity={0.8}
              onPress={() => router.push(`/place/${item.id}`)} // Navigate to Place Details
            >
              <Image
                source={{ uri: item.image }} // Ensure it's wrapped in { uri: 'URL' }
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.overlay}>
                <Text style={styles.tripTitle}>{item.title}</Text>
                <Text style={styles.distance}>{item.distance} km</Text>
              </View>
              <Image
                source={{ uri: item.icon }}
                style={{
                  width: 50,
                  height: 50,
                  position: "absolute",
                  top: 10,
                  right: 10,
                }}
              />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button - Rounded */}
      <TouchableOpacity style={styles.fab}>
        <FontAwesome name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: height * 0.08,
    backgroundColor: "#FFF",
    elevation: 5, // Shadow effect for Android
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D3D47",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D3D47",
    marginHorizontal: 20,
    marginTop: 20,
  },
  tripContainer: {
    marginBottom: 330,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFF",
    elevation: 4, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  image: {
    width: "100%",
    height: height * 0.3, // Increased height for better fit
    resizeMode: "cover",
    borderRadius: 18,
  },
  overlay: {
    position: "absolute",
    justifyContent: "space-between",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  distance: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFD700", // Gold color
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ff8800",
    width: 70, // Ensure button is a perfect circle
    height: 70,
    borderRadius: 35, // Makes it round
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // Shadow for Android
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
