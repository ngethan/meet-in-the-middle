import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-100">
      {/* 📌 Header */}
      <View className="flex-row items-center px-6 py-6 bg-orange-500 shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white ml-4 py-12">About</Text>
      </View>

      {/* 📌 Content Section */}
      <ScrollView className="p-6">
        {/* 📌 App Overview */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome to Our Trip Planner!
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Our app helps groups find the optimal meeting spot based on
            individual starting locations. Whether you're planning a casual
            meetup, a business trip, or a large group gathering, our intelligent
            system ensures that everyone travels efficiently.
          </Text>
        </View>

        {/* 📌 Key Features */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900">Key Features</Text>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="map-marker" size={24} color="red" />
            <Text className="ml-3 text-base text-gray-700">
              Trip Optimization - Finds the best meeting spot for all
              participants.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="comments" size={24} color="blue" />
            <Text className="ml-3 text-base text-gray-700">
              Group Chat - Discuss trip plans in real-time.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="road" size={24} color="green" />
            <Text className="ml-3 text-base text-gray-700">
              Navigation & Routes - Get real-time directions to your
              destination.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="user-plus" size={24} color="purple" />
            <Text className="ml-3 text-base text-gray-700">
              Invite & Manage Participants - Easily add friends to trips.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="search-location" size={24} color="orange" />
            <Text className="ml-3 text-base text-gray-700">
              Smart Location Picker - Pick your starting point using a map.
            </Text>
          </View>
        </View>

        {/* 📌 How It Works */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900">How It Works</Text>

          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800">
              1. Create a Group Chat
            </Text>
            <Text className="text-base text-gray-600 ml-4">
              Start by creating a group with your friends or colleagues.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800">
              2. Invite Members
            </Text>
            <Text className="text-base text-gray-600 ml-4">
              Add all participants so everyone can plan together.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800">
              3. Enter Your Starting Locations
            </Text>
            <Text className="text-base text-gray-600 ml-4">
              Each user selects their current location on a map.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800">
              4. Get the Best Meeting Spot
            </Text>
            <Text className="text-base text-gray-600 ml-4">
              The app calculates the best meeting point based on travel time.
            </Text>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-bold text-gray-800">
              5. Get Directions
            </Text>
            <Text className="text-base text-gray-600 ml-4">
              Receive optimized routes for each participant.
            </Text>
          </View>
        </View>

        {/* 📌 Technologies Used */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900">
            Technologies Used
          </Text>
          <View className="mt-2">
            <Text className="text-base text-gray-600">
              • React Native & Expo for the mobile app 📱
            </Text>
            <Text className="text-base text-gray-600">
              • Google Maps API for real-time navigation 🗺️
            </Text>
            <Text className="text-base text-gray-600">
              • Supabase for backend & real-time database 🔥
            </Text>
            <Text className="text-base text-gray-600">
              • Supabase database with simple fetching for live chat 💬
            </Text>
          </View>
        </View>

        {/* 📌 Future Plans */}
        <View className="mb-12">
          <Text className="text-xl font-bold text-gray-900">Future Plans</Text>
          <Text className="text-base text-gray-600">
            {" "}
            🚀 Saved trips & favorite locations{" "}
          </Text>
          <Text className="text-base text-gray-600">
            {" "}
            🚀 AI-Powered Smart Routing – Use machine learning to improve
            meeting point selection based on traffic, weather, and historical
            travel data, and also users' preferences{" "}
          </Text>
          <Text className="text-base text-gray-600">
            {" "}
            🚀 Multi-Stop Trip Planning – Allow users to add multiple
            destinations along the way{" "}
          </Text>
          <Text className="text-base text-gray-600">
            {" "}
            🚀 Integration with Public Transport APIs – Provide real-time metro,
            bus, and train schedules to improve navigation options.{" "}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
