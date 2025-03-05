import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthProvider";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [formattedLocation, setFormattedLocation] = useState(
    "Fetching location...",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);

      if (!user) {
        setErrorMsg("User not found.");
        return;
      }

      // ✅ Fetch user profile
      const { data, error } = await supabase
        .from("users")
        .select("fullName")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setEmail(user.email);
      setFullName(data?.fullName || "Not set");
      // ✅ Fetch location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setFormattedLocation("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let geoAddress = await Location.reverseGeocodeAsync(location.coords);

      if (geoAddress.length > 0) {
        const { city, region, country } = geoAddress[0];
        setFormattedLocation(`${city}, ${region}, ${country}`);
      } else {
        setFormattedLocation("Location unavailable");
      }
    } catch (error) {
      setErrorMsg("Error fetching profile.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white px-5 py-20">
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} className="p-3 top-30">
        <FontAwesome name="arrow-left" size={32} color="black" />
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-gray-900 text-center mb-6">
        My Profile
      </Text>

      {/* 📌 Email */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-300">
        <Text className="text-gray-700 font-semibold">Email</Text>
        <Text className="text-lg text-gray-800">
          {email || "Not available"}
        </Text>
      </View>

      {/* 📌 Full Name */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-300">
        <Text className="text-gray-700 font-semibold">Full Name</Text>
        <Text className="text-lg text-gray-800">
          {loading ? (
            <ActivityIndicator size="small" color="#ED8F03" />
          ) : (
            fullName
          )}
        </Text>
      </View>

      {/* 📌 Location */}
      <View className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-300">
        <Text className="text-gray-700 font-semibold">Location</Text>
        <Text className="text-lg text-gray-800">
          {loading ? (
            <ActivityIndicator size="small" color="#ED8F03" />
          ) : (
            formattedLocation
          )}
        </Text>
      </View>

      {/* 📌 Error Message (If Any) */}
      {errorMsg ? (
        <Text className="text-red-500 text-center mt-4">{errorMsg}</Text>
      ) : null}
    </View>
  );
}
