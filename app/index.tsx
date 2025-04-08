import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen() {
  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Scale and fade animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const floatingY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -8],
  });

  return (
    <Link href="/tutorial" asChild>
      <TouchableOpacity className="flex-1" activeOpacity={0.9}>
        <LinearGradient
          colors={["#4A90E9", "#6B3FE0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        <View className="flex-1 justify-center items-center px-8">
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }}
            className="items-center px-12 py-8 rounded-3xl backdrop-blur-xl"
          >
            <Animated.Text
              className="text-white text-8xl font-black tracking-tight"
              style={{
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 5,
              }}
            >
              MITM
            </Animated.Text>
            <Animated.Text className="text-white/90 text-xl font-medium mt-4 text-center">
              Where Every Journey
              {"\n"}
              Begins Together
            </Animated.Text>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: floatingY }],
              opacity: fadeAnim,
            }}
            className="absolute bottom-32"
          >
            <View className="bg-white/20 px-8 py-4 rounded-full backdrop-blur-sm">
              <Text className="text-white text-lg font-medium">
                Tap to Start →
              </Text>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
