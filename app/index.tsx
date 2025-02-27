import React, { useEffect, useRef } from "react";
import { View, Animated, TouchableOpacity, Text } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen() {
  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  const floatingY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -10], // Smooth floating motion
  });

  return (
    <Link href="/tutorial" asChild>
      <TouchableOpacity className="flex-1" activeOpacity={0.8}>
        {/* Full-Screen Gradient Background */}
        <LinearGradient
          colors={["#FFB95E", "#ED8F03"]}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Centered Content */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Animated Title & Slogan */}
          <View className="items-center">
            <Animated.Text
              style={{ opacity: fadeAnim }}
              className="text-white text-7xl font-extrabold tracking-wide"
            >
              Oddyseez
            </Animated.Text>
            <Animated.Text
              style={{ opacity: fadeAnim }}
              className="text-white text-xl font-semibold mt-3 text-center"
            >
              Where Every Trip Starts Together
            </Animated.Text>
          </View>

          {/* Floating Call-to-Action */}
          <Animated.Text
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: floatingY }],
            }}
            className="absolute bottom-40 text-white text-lg font-medium opacity-90 animate-pulse"
          >
            Tap anywhere to continue
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
