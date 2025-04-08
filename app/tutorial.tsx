import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Bus,
  LucideIcon,
} from "lucide-react-native";
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
    shadowOpacity: 0.8,
    shadowRadius: 15 + glow.value * 15,
    shadowColor: interpolateColor(glow.value, [0, 1], ["#FF6B6B", "#4ECDC4"]),
    shadowOffset: { width: 0, height: 4 },
    transform: [{ scale: 1 + glow.value * 0.03 }],
  }));

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row items-center px-6 py-16 bg-blue-500 shadow-lg">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white ml-4">App Tutorial</Text>
      </View>

      <ScrollView className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 text-center">
            🚀 Welcome to Trip Planner!
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            Your smart travel assistant for planning trips efficiently. Let's
            get started!
          </Text>
        </View>

        <View className="mb-12 bg-white p-6 rounded-xl shadow-md">
          <TouchableOpacity
            onPress={toggleExpand}
            className="p-4 bg-blue-500 rounded-lg"
          >
            <Text className="text-lg font-bold text-white text-center">
              {expanded ? "Hide Guide ⬆️" : "Show App Guide ⬇️"}
            </Text>
          </TouchableOpacity>

          <Animated.View style={animatedStyle}>
            <ScrollView className="mt-4">
              <Step
                title="Step 1: Create a Group"
                description="Start by creating a group with your friends, colleagues, or family members."
              />

              <Step
                title="Step 2: Add Participants"
                description="Invite users to your trip by selecting them from your contacts."
              />

              <Step
                title="Step 3: Navigate To the Trips Screen"
                description="Go to the collection of trips using the dropdown on the top right corner of the screen."
              />

              <Step
                title="Step 4: Create a New Trip"
                description="Create a new trip with a new trip name and start date/time with end date/time. All users in the chat are default in the trip."
              />

              <Step
                title="Step 5: Set Your Starting Location(s)"
                description="Choose your starting location on the map or enter an address manually."
              />

              <Step
                title="Step 6: Get the Best Meeting Spot"
                description="The app finds the most convenient location for everyone based on real-time travel data."
              />

              <Step
                title="Step 7: Navigate Easily"
                description="Get optimized routes and directions to the meeting point."
              />

              <View className="bg-gray-100 p-4 rounded-lg mt-4">
                <Text className="text-lg font-bold text-gray-900">
                  🔍 Extra Features
                </Text>

                <Feature
                  Icon={MessageSquare}
                  color="blue"
                  text="Live Chat - Communicate with participants in real-time."
                />
                <Feature
                  Icon={Save}
                  color="green"
                  text="Save Trips - Keep your trips saved for future reference."
                />
                <Feature
                  Icon={Bus}
                  color="purple"
                  text="Public Transport Integration - Get real-time transit info."
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        <Animated.View style={[animatedGlowStyle]}>
          <TouchableOpacity
            className="mb-12 bg-blue-500 p-6 rounded-xl"
            onPress={() => router.push("/auth")}
            activeOpacity={0.7}
          >
            <Text className="text-lg font-bold text-white text-center">
              You're all set! 🎉
            </Text>
            <Text className="text-base font-bold text-teal-200 mt-2 text-center">
              Click to start planning your trips now and make every meetup
              hassle-free!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const Step = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <View className="mb-4 bg-white p-4 rounded-lg shadow-sm">
    <Text className="text-lg font-bold text-gray-900">{title}</Text>
    <Text className="text-base text-gray-600 mt-2">{description}</Text>
  </View>
);

const Feature = ({
  Icon,
  color,
  text,
}: {
  Icon: LucideIcon;
  color: string;
  text: string;
}) => (
  <View className="flex-row items-center mt-4">
    <Icon size={24} color={color} />
    <Text className="ml-3 text-base text-gray-700">{text}</Text>
  </View>
);
