import "../styles/global.css";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthProvider";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{ title: "Welcome", headerShown: false }}
        />
        <Stack.Screen name="tutorial" options={{ title: "Tutorial" }} />
        <Stack.Screen name="home" options={{ title: "Home" }} />
        <Stack.Screen name="auth" options={{ title: "Auth" }} />
        <Stack.Screen name="(tabs)" options={{ title: "Tabs" }} />
        <Stack.Screen name="place/[id]" options={{ title: "Place Details" }} />
        <Stack.Screen name="trips" options={{ title: "Trips" }} />
        <Stack.Screen name="trip/[id]" options={{ title: "Trip Details" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="about" options={{ title: "About" }} />
        <Stack.Screen name="start_trip" options={{ title: "Start Trip" }} />
        <Stack.Screen name="map" options={{ title: "MapScreen" }} />
      </Stack>
    </AuthProvider>
  );
}

// function RootLayoutNav() {
//   const colorScheme = useColorScheme();

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="modal" options={{ presentation: "modal" }} />
//       </Stack>
//     </ThemeProvider>
//   );
// }
