import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
  StatusBar,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function WelcomeScreen() {
  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation
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

    // Subtle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Pulsing animation for CTA
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const floatingY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -8],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-1deg", "1deg"],
  });

  return (
    <Link href="/tutorial" asChild>
      <TouchableOpacity className="flex-1" activeOpacity={0.8}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <LinearGradient
          colors={["#4361EE", "#3A0CA3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Decorative elements */}
        <Animated.View
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.1)",
            transform: [{ translateY: floatingY }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            bottom: "25%",
            right: "5%",
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.08)",
            transform: [{ translateY: floatingY }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            top: "35%",
            right: "15%",
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.05)",
            transform: [{ translateY: floatingY }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            bottom: "45%",
            left: "20%",
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.07)",
            transform: [{ translateY: floatingY }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            top: "60%",
            left: "5%",
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.04)",
            transform: [{ translateY: floatingY }],
          }}
        />

        <View className="flex-1 justify-center items-center px-8">
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
              opacity: fadeAnim,
            }}
            className="items-center px-12 py-10 rounded-3xl"
          >
            <Animated.Text
              className="text-white text-8xl font-black tracking-tight"
              style={{
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 8,
              }}
            >
              MITM
            </Animated.Text>

            <Animated.Text
              className="text-white/90 text-xl font-medium mt-4 text-center"
              style={{
                textShadowColor: "rgba(0,0,0,0.2)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            >
              Where Every Journey
              {"\n"}
              Begins Together
            </Animated.Text>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: floatingY }, { scale: pulseAnim }],
              opacity: fadeAnim,
            }}
            className="absolute bottom-32"
          >
            <Text className="text-white text-lg font-medium">
              Tap to Start →
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
