import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../app/home";
import ChatScreen from "../app/chat";
import { FontAwesome } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#007bff", // Highlighted tab color
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "#FFF", paddingBottom: 5, height: 60 },
        headerShown: false, // Hide top header
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="comments" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
