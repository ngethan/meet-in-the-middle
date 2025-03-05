import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

export default function TutorialScreen() {
  const router = useRouter();

  // Glow effect animation
  const glow = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);

  const toggleExpand = () => {
    height.value = withTiming(expanded ? 0 : 500, { duration: 400 });
    setExpanded(!expanded);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: "hidden",
  }));

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, []);

  // Animated glowing style
  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 1,
    shadowRadius: 10 + glow.value * 10,
    shadowColor: interpolateColor(glow.value, [0, 1], ["#ff9800", "#ff5722"]),
    shadowOffset: { width: 0, height: 0 },
    transform: [{ scale: 1 + glow.value * 0.05 }],
  }));

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

        <View className="mb-12 bg-white p-6 rounded-xl shadow-md">
          <TouchableOpacity
            onPress={toggleExpand}
            className="p-4 bg-orange-500 rounded-lg"
          >
            <Text className="text-lg font-bold text-white text-center">
              {expanded ? "Hide Guide ⬆️" : "Show Trip Guide ⬇️"}
            </Text>
          </TouchableOpacity>

          <Animated.View style={animatedStyle}>
            <ScrollView className="mt-4">
              {/* 📌 Step 1 - Create a Group */}
              <Step
                title="Step 1: Create a Group"
                description="Start by creating a group with your friends, colleagues, or family members."
              />

              {/* 📌 Step 2 - Add Participants */}
              <Step
                title="Step 2: Add Participants"
                description="Invite users to your trip by selecting them from your contacts."
              />

              {/* 📌 Step 3 - Navigate to Trips */}
              <Step
                title="Step 3: Navigate To the Trips Screen"
                description="Go to the collection of trips using the dropdown on the top right corner of the screen."
              />

              {/* 📌 Step 4 - Create a New Trip */}
              <Step
                title="Step 4: Create a New Trip"
                description="Create a new trip with a new trip name and start date/time with end date/time. All users in the chat are default in the trip."
              />

              {/* 📌 Step 5 - Set Your Starting Location */}
              <Step
                title="Step 5: Set Your Starting Location(s)"
                description="Choose your starting location on the map or enter an address manually."
              />

              {/* 📌 Step 6 - Get the Best Meeting Spot */}
              <Step
                title="Step 6: Get the Best Meeting Spot"
                description="The app finds the most convenient location for everyone based on real-time travel data."
              />

              {/* 📌 Step 7 - Navigate Easily */}
              <Step
                title="Step 7: Navigate Easily"
                description="Get optimized routes and directions to the meeting point."
              />

              {/* 📌 Extra Features */}
              <View className="bg-gray-100 p-4 rounded-lg mt-4">
                <Text className="text-lg font-bold text-gray-900">
                  🔍 Extra Features
                </Text>

                <Feature
                  icon="comments"
                  color="blue"
                  text="Live Chat - Communicate with participants in real-time."
                />
                <Feature
                  icon="save"
                  color="green"
                  text="Save Trips - Keep your trips saved for future reference."
                />
                <Feature
                  icon="bus"
                  color="purple"
                  text="Public Transport Integration - Get real-time transit info."
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        {/* 📌 Final Note */}
        <Animated.View style={[animatedGlowStyle]}>
          <TouchableOpacity
            className="mb-12 bg-orange-500 p-6 rounded-xl"
            onPress={() => router.push("/auth")}
            activeOpacity={0.7}
          >
            <Text className="text-lg font-bold text-white text-center">
              You're all set! 🎉
            </Text>
            <Text className="text-base font-bold text-orange-200 mt-2 text-center">
              Click to start planning your trips now and make every meetup
              hassle-free!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Reusable Step Component
const Step = ({ title, description }) => (
  <View className="mb-4 bg-white p-4 rounded-lg shadow-sm">
    <Text className="text-lg font-bold text-gray-900">{title}</Text>
    <Text className="text-base text-gray-600 mt-2">{description}</Text>
  </View>
);

// Reusable Feature Component
const Feature = ({ icon, color, text }) => (
  <View className="flex-row items-center mt-4">
    <FontAwesome name={icon} size={24} color={color} />
    <Text className="ml-3 text-base text-gray-700">{text}</Text>
  </View>
);
