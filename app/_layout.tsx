import "../styles/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthProvider";
import { LocationProvider } from "@/context/LocationProvider";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Configure initial route settings
export const unstable_settings = {
  initialRouteName: "index",
};

// Export error boundary for better error handling
export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  // Load custom fonts
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Handle font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  // Common screen options
  const defaultScreenOptions = {
    headerShown: false,
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <Stack screenOptions={defaultScreenOptions}>
          <Stack.Screen name="index" options={{ title: "Welcome" }} />
          <Stack.Screen
            name="tutorial"
            options={{ title: "Tutorial", headerShown: false }}
          />
          <Stack.Screen
            name="auth"
            options={{ title: "Auth", headerShown: false }}
          />
          <Stack.Screen name="(tabs)" options={{ title: "Tabs" }} />
          <Stack.Screen
            name="place/[id]"
            options={{ title: "Place Details", headerShown: false }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{ title: "Event Details", headerShown: false }}
          />
          <Stack.Screen
            name="trip/[id]"
            options={{ title: "Trip Details", headerShown: false }}
          />
          <Stack.Screen
            name="chatbox/[id]"
            options={{ title: "Chat Box", headerShown: false }}
          />
          <Stack.Screen
            name="profile"
            options={{ title: "Profile", headerShown: false }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: "Settings", headerShown: false }}
          />
          <Stack.Screen
            name="about"
            options={{ title: "About", headerShown: false }}
          />
          <Stack.Screen
            name="start_trip"
            options={{ title: "Start Trip", headerShown: false }}
          />
          <Stack.Screen
            name="map"
            options={{ title: "MapScreen", headerShown: false }}
          />
        </Stack>
      </LocationProvider>
    </AuthProvider>
  );
}
