import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { supabase } from "@/lib/supabase";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const polyline = require("@mapbox/polyline");

export default function TripScreen() {
  const { tripId } = useLocalSearchParams(); // Get trip ID from URL
  const [participants, setParticipants] = useState([]);
  const [bestLocation, setBestLocation] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  /** 📌 Fetch Participants & Best Location */
  async function fetchTripData() {
    try {
      setLoading(true);

      // ✅ Fetch all trip participants
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("trip_participants")
          .select("user_id, starting_location, latitude, longitude")
          .eq("trip_id", tripId);

      if (participantsError) throw participantsError;

      // ✅ Fetch best destination
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("best_location, best_latitude, best_longitude, best_address")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;

      setParticipants(participantsData);
      setBestLocation(tripData);
    } catch (error) {
      console.error("Error fetching trip data:", error);
      Alert.alert("Error", "Failed to fetch trip data.");
    } finally {
      setLoading(false);
    }
  }

  /** 📌 Fetch Routes for All Participants */
  async function startTrip() {
    if (!bestLocation || participants.length === 0) {
      Alert.alert("Error", "No destination or participants found.");
      return;
    }

    setLoading(true);
    let newRoutes = [];

    for (const participant of participants) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json`,
          {
            params: {
              origin: `${participant.latitude},${participant.longitude}`,
              destination: `${bestLocation.best_latitude},${bestLocation.best_longitude}`,
              key: GOOGLE_MAPS_API_KEY,
              mode: "driving",
            },
          },
        );

        if (response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const points = polyline.decode(route.overview_polyline.points);
          const decodedCoords = points.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }));

          newRoutes.push({
            userId: participant.user_id,
            coordinates: decodedCoords,
          });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    }

    setRoutes(newRoutes);
    setLoading(false);
  }

  return (
    <View className="flex-1">
      {/* 📌 Map */}
      <MapView
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude: bestLocation?.best_latitude || 38.65709289910062, // Default location
          longitude: bestLocation?.best_longitude || -90.30219997026222,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {/* 📍 Best Destination Marker */}
        {bestLocation && (
          <Marker
            coordinate={{
              latitude: bestLocation.best_latitude,
              longitude: bestLocation.best_longitude,
            }}
            title={bestLocation.best_location}
            description={bestLocation.best_address}
            pinColor="green"
          />
        )}

        {/* 📍 Participant Markers */}
        {participants.map((participant) => (
          <Marker
            key={participant.user_id}
            coordinate={{
              latitude: participant.latitude,
              longitude: participant.longitude,
            }}
            title={participant.starting_location}
            pinColor="blue"
          />
        ))}

        {/* 🛣️ Routes for Each Participant */}
        {routes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route.coordinates}
            strokeWidth={4}
            strokeColor="blue"
          />
        ))}
      </MapView>

      {/* 📌 Start Trip Button */}
      <View className="absolute bottom-10 left-0 right-0 flex items-center">
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg shadow-lg"
          onPress={startTrip}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Start Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
