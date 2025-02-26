import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function TutorialScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-100">
      {/* 📌 Header */}
      <View className="flex-row items-center px-6 py-16 bg-orange-500 shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white ml-4">App Tutorial</Text>
      </View>

      {/* 📌 Content Section */}
      <ScrollView className="p-6">
        {/* 🌟 Welcome */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 text-center">
            🚀 Welcome to Trip Planner!
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            Your smart travel assistant for planning trips efficiently. Let’s
            get started!
          </Text>
        </View>

        {/* 📌 Step 1 - Create a Group */}
        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 1: Create a Group
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Start by creating a group with your friends, colleagues, or family
            members.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        {/* 📌 Step 2 - Add Participants */}
        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 2: Add Participants
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Invite users to your trip by selecting them from your contacts.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 3: Navigate To the Trips Screen{" "}
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Go to the collection of trips using the dropdown on the top right
            corner of the screen.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 4: Create a New Trip
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Create a new trip with a new trip name and start date/time with end
            date/time, all users in the chat are default in the trip
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 5: Set Your Starting Location(s)
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Choose your starting location on the map or enter an address
            manually.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 6: Get the Best Meeting Spot
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            The app finds the most convenient location for everyone based on
            real-time travel data.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            Step 7: Navigate Easily
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Get optimized routes and directions to the meeting point.
          </Text>
          {/* <Image 
            source={{ uri: "https://via.placeholder.com/400" }} 
            className="w-full h-48 rounded-lg mt-3" 
          /> */}
        </View>

        {/* 📌 Extra Features */}
        <View className="mb-6 bg-white p-6 rounded-xl shadow-md">
          <Text className="text-lg font-bold text-gray-900">
            🔍 Extra Features
          </Text>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="comments" size={24} color="blue" />
            <Text className="ml-3 text-base text-gray-700">
              Live Chat - Communicate with participants in real-time.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="save" size={24} color="green" />
            <Text className="ml-3 text-base text-gray-700">
              Save Trips - Keep your trips saved for future reference.
            </Text>
          </View>

          <View className="flex-row items-center mt-4">
            <FontAwesome name="bus" size={24} color="purple" />
            <Text className="ml-3 text-base text-gray-700">
              Public Transport Integration - Get real-time transit info.
            </Text>
          </View>
        </View>

        {/* 📌 Final Note */}
        <TouchableOpacity
          className="mb-12 bg-orange-200 p-6 rounded-xl shadow-md"
          onPress={() => router.push("/auth")}
        >
          <Text className="text-lg font-bold text-gray-900 text-center">
            You're all set! 🎉
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            Click to start planning your trips now and make every meetup
            hassle-free!
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
