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
    <View className="flex-1 bg-neutral-50">
      <View className="flex-row items-center px-6 py-16 bg-blue-600 shadow-md">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-white/20 rounded-full"
        >
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white ml-4">App Tutorial</Text>
      </View>

      <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Welcome to Trip Planner
          </Text>
          <Text className="text-base text-gray-600 mt-3 text-center leading-relaxed">
            Your smart travel assistant for planning trips efficiently and
            making every meetup hassle-free.
          </Text>
        </View>

        <View className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <TouchableOpacity
            onPress={toggleExpand}
            className="p-4 bg-blue-600 rounded-xl active:bg-blue-700"
          >
            <Text className="text-base font-semibold text-white text-center">
              {expanded ? "Hide Guide ↑" : "Show App Guide ↓"}
            </Text>
          </TouchableOpacity>

          <Animated.View style={animatedStyle}>
            <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
              <Step
                title="Create a Group"
                description="Start by creating a group with your friends, colleagues, or family members."
                number="1"
              />

              <Step
                title="Add Participants"
                description="Invite users to your trip by selecting them from your contacts."
                number="2"
              />

              <Step
                title="Navigate To the Trips Screen"
                description="Go to the collection of trips using the dropdown on the top right corner of the screen."
                number="3"
              />

              <Step
                title="Create a New Trip"
                description="Create a new trip with a name and schedule. All users in the chat are included by default."
                number="4"
              />

              <Step
                title="Set Your Starting Location(s)"
                description="Choose your starting location on the map or enter an address manually."
                number="5"
              />

              <Step
                title="Get the Best Meeting Spot"
                description="The app finds the most convenient location for everyone based on real-time travel data."
                number="6"
              />

              <Step
                title="Navigate Easily"
                description="Get optimized routes and directions to the meeting point."
                number="7"
              />

              <View className="bg-blue-50 p-5 rounded-xl mt-6 border border-blue-100">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Extra Features
                </Text>

                <Feature
                  Icon={MessageSquare}
                  color="#4F46E5"
                  text="Live Chat - Communicate with participants in real-time."
                />
                <Feature
                  Icon={Save}
                  color="#10B981"
                  text="Save Trips - Keep your trips saved for future reference."
                />
                <Feature
                  Icon={Bus}
                  color="#8B5CF6"
                  text="Public Transport Integration - Get real-time transit info."
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        <Animated.View style={[animatedGlowStyle]}>
          <TouchableOpacity
            className="mb-8 bg-blue-600 p-6 rounded-xl shadow-sm active:bg-blue-700"
            onPress={() => router.push("/auth")}
            activeOpacity={0.8}
          >
            <Text className="text-xl font-bold text-white text-center">
              You're all set! 🎉
            </Text>
            <Text className="text-base text-white mt-3 text-center leading-relaxed">
              Start planning your trips now and make every meetup effortless
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
  number,
}: {
  title: string;
  description: string;
  number: string;
}) => (
  <View className="mb-5 flex-row">
    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-4 mt-1">
      <Text className="text-blue-600 font-bold">{number}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      <Text className="text-base text-gray-600 mt-1 leading-relaxed">
        {description}
      </Text>
    </View>
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
  <View className="flex-row items-center mb-4 last:mb-0">
    <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
      <Icon size={20} color={color} />
    </View>
    <Text className="ml-4 text-base text-gray-700 flex-1">{text}</Text>
  </View>
);
