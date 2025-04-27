import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { ArrowLeft, Mail, User, MapPin } from "lucide-react-native";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthProvider";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
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
        .select("*")
        .eq("id", user.id)
        .single();
      console.log(data);

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
    <View className="flex-1 bg-gradient-to-b from-white to-blue-50">
      {/* Header with Back Button */}
      <View className="px-5 pt-16 pb-6 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-white rounded-full shadow-sm active:bg-gray-100"
        >
          <ArrowLeft size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 ml-4">
          My Profile
        </Text>
      </View>

      {/* Profile Content */}
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Card */}
        <View className="bg-white rounded-3xl shadow-md p-6 mb-6 border border-gray-100">
          {/* Email */}
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <Mail size={18} color="#3b82f6" />
              <Text className="text-gray-600 font-medium ml-2">Email</Text>
            </View>
            <Text className="text-lg text-gray-800 font-semibold pl-7">
              {email || "Not available"}
            </Text>
          </View>

          {/* Full Name */}
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <User size={18} color="#3b82f6" />
              <Text className="text-gray-600 font-medium ml-2">Full Name</Text>
            </View>
            <View className="pl-7">
              {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text className="text-lg text-gray-800 font-semibold">
                  {fullName}
                </Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View>
            <View className="flex-row items-center mb-2">
              <MapPin size={18} color="#3b82f6" />
              <Text className="text-gray-600 font-medium ml-2">Location</Text>
            </View>
            <View className="pl-7">
              {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text className="text-lg text-gray-800 font-semibold">
                  {formattedLocation}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {/* <TouchableOpacity className="bg-blue-500 py-4 rounded-xl shadow-sm mb-4 active:bg-blue-600">
          <Text className="text-white font-bold text-center">Edit Profile</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity className="bg-white py-4 rounded-xl shadow-sm border border-gray-200 active:bg-gray-50">
          <Text className="text-blue-500 font-bold text-center">Sign Out</Text>
        </TouchableOpacity> */}

        {/* Error Message (If Any) */}
        {errorMsg ? (
          <View className="bg-red-50 p-4 rounded-xl mt-6 border border-red-100">
            <Text className="text-red-500 text-center">{errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
