import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, Image, TouchableOpacity, Text } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient"; // Correct import for Expo

export default function WelcomeScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating Animation (Up and Down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1, // Move up
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, // Move down
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade-in Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Interpolating floatAnim to move up and down
  const floatingY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -10], // Moves smoothly up & down
  });

  return (
    <Link href="/auth" asChild>
      <TouchableOpacity style={styles.container} activeOpacity={0.8}>
      <LinearGradient colors={["#ffd691", "#ED8F03"]} style={styles.gradient}>
      <View style={styles.topContainer}>
            {/* <Image source={require("../assets/log.png")} style={styles.logo} /> */}
            <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
              Oddyseez
            </Animated.Text>
            <Animated.Text style={[styles.sloganText, { opacity: fadeAnim }]}>
              Where Every Trip Starts Together
            </Animated.Text>
          </View>

          <View style={styles.bottomContainer}>
            <Animated.Text
              style={[
                styles.continueText,
                { opacity: fadeAnim, transform: [{ translateY: floatingY }] },
              ]}
            >
              Tap anywhere to continue
            </Animated.Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 300,
  },
  bottomContainer: {
    flex: 0.5,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 180,
  },
  logo: {
    width: 400,
    height: 400,
    marginBottom: 40,
    resizeMode: "contain",
  },
  welcomeText: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 40,
  },
  sloganText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFF",
    opacity: 0.8,
  },
});
