import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Plane, MapPin, Compass } from "lucide-react-native";

export default function WelcomeScreen() {
  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

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

    // Icon rotation animation
    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      }),
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

  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Link href="/auth" asChild>
      <TouchableOpacity className="flex-1" activeOpacity={0.8}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <LinearGradient
          colors={["#3b82f6", "#1e40af"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Background pattern */}
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.05,
            zIndex: 1,
          }}
        >
          <Image
            source={require("../assets/images/world-map.png")}
            style={{ width: "100%", height: "100%", opacity: 0.6 }}
            resizeMode="cover"
          />
        </View>

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
            zIndex: 2,
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
            zIndex: 2,
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
            zIndex: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: iconRotation }],
            }}
          >
            <Compass size={40} color="rgba(255,255,255,0.6)" />
          </Animated.View>
        </Animated.View>

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
            zIndex: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MapPin size={24} color="rgba(255,255,255,0.6)" />
        </Animated.View>

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
            zIndex: 2,
          }}
        />

        <View className="flex-1 justify-center items-center px-8 z-10">
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
              opacity: fadeAnim,
            }}
            className="items-center px-12 py-10 rounded-3xl"
          >
            <Animated.View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Plane
                size={40}
                color="white"
                style={{ marginRight: 12 }}
                strokeWidth={1.5}
              />
              <Animated.Text
                className="text-white text-7xl font-black tracking-tight"
                style={{
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                MITM
              </Animated.Text>
            </Animated.View>

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
              transform: [{ scale: pulseAnim }],
              opacity: fadeAnim,
              marginTop: 80,
            }}
          >
            <TouchableOpacity
              className=" px-8 py-4border border-white/30"
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg font-semibold">
                Start Your Journey
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: floatingY }],
              opacity: fadeAnim,
            }}
            className="absolute bottom-16"
          >
            <Text className="text-white/80 text-base font-medium">
              Discover • Connect • Travel
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
