import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  UserPlus,
  Search,
  Compass,
  ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

export default function AboutScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const { width } = Dimensions.get("window");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 bg-gray-50">
      <Animated.View
        style={{ height: headerHeight }}
        className="relative bg-blue-500"
      >
        <View className="flex-row items-center px-6 h-full">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="p-2 bg-white/20 rounded-full"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Animated.Text
            style={{ transform: [{ scale: titleScale }] }}
            className="text-2xl font-bold text-white ml-4"
          >
            About MITM
          </Animated.Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mb-8"
        >
          <Text className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Meet In The Middle
          </Text>
          <Text className="text-lg text-gray-700 leading-relaxed">
            Our app helps groups find the optimal meeting spot based on
            individual starting locations. Whether you're planning a casual
            meetup, a business trip, or a large group gathering, our intelligent
            system ensures that everyone travels efficiently.
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mb-8"
        >
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Key Features
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-5 bg-white rounded-2xl mb-3 shadow-sm"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-xl bg-red-100 items-center justify-center">
              <MapPin size={24} color="#EF4444" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800">
                Trip Optimization
              </Text>
              <Text className="text-gray-600">
                Finds the best meeting spot for all participants
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-5 bg-white rounded-2xl mb-3 shadow-sm"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
              <MessageSquare size={24} color="#3B82F6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800">
                Group Chat
              </Text>
              <Text className="text-gray-600">
                Discuss trip plans in real-time
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-5 bg-white rounded-2xl mb-3 shadow-sm"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-xl bg-green-100 items-center justify-center">
              <Compass size={24} color="#10B981" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800">
                Navigation & Routes
              </Text>
              <Text className="text-gray-600">
                Get real-time directions to your destination
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-5 bg-white rounded-2xl mb-3 shadow-sm"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-xl bg-purple-100 items-center justify-center">
              <UserPlus size={24} color="#8B5CF6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800">
                Invite & Manage Participants
              </Text>
              <Text className="text-gray-600">Easily add friends to trips</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-5 bg-white rounded-2xl mb-3 shadow-sm"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-xl bg-orange-100 items-center justify-center">
              <Search size={24} color="#F59E0B" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800">
                Smart Location Picker
              </Text>
              <Text className="text-gray-600">
                Pick your starting point using a map
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mb-8"
        >
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            How It Works
          </Text>

          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex-row mb-5">
              <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white font-bold">1</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  Create a Group Chat
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  Start by creating a group with your friends or colleagues.
                </Text>
              </View>
            </View>

            <View className="flex-row mb-5">
              <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white font-bold">2</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  Invite Members
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  Add all participants so everyone can plan together.
                </Text>
              </View>
            </View>

            <View className="flex-row mb-5">
              <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white font-bold">3</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  Enter Your Starting Locations
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  Each user selects their current location on a map.
                </Text>
              </View>
            </View>

            <View className="flex-row mb-5">
              <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white font-bold">4</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  Get the Best Meeting Spot
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  The app calculates the best meeting point based on travel
                  time.
                </Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white font-bold">5</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  Get Directions
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  Receive optimized routes for each participant.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mb-8"
        >
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Technologies Used
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-base text-gray-700">
                React Native & Expo for the mobile app 📱
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-base text-gray-700">
                Google Maps API for real-time navigation 🗺️
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-base text-gray-700">
                Supabase for backend & real-time database 🔥
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <Text className="text-base text-gray-700">
                Supabase database with simple fetching for live chat 💬
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mb-12"
        >
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Future Plans
          </Text>
          <LinearGradient
            colors={["#F9FAFB", "#EFF6FF"]}
            className="rounded-2xl p-6 shadow-sm"
          >
            <View className="flex-row items-center mb-4">
              <Text className="text-2xl mr-2">🚀</Text>
              <Text className="text-base text-gray-700 flex-1">
                Saved trips & favorite locations
              </Text>
            </View>
            <View className="flex-row items-center mb-4">
              <Text className="text-2xl mr-2">🚀</Text>
              <Text className="text-base text-gray-700 flex-1">
                AI-Powered Smart Routing – Use machine learning to improve
                meeting point selection based on traffic, weather, and
                historical travel data, and also users' preferences
              </Text>
            </View>
            <View className="flex-row items-center mb-4">
              <Text className="text-2xl mr-2">🚀</Text>
              <Text className="text-base text-gray-700 flex-1">
                Multi-Stop Trip Planning – Allow users to add multiple
                destinations along the way
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🚀</Text>
              <Text className="text-base text-gray-700 flex-1">
                Integration with Public Transport APIs – Provide real-time
                metro, bus, and train schedules to improve navigation options
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}
