import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthProvider";

const { width, height } = Dimensions.get("window");

interface NavigationDrawerProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function NavigationDrawer({
  onClose,
  isOpen,
}: NavigationDrawerProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const { user, signOut } = useAuth();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -width * 0.7,
      duration: 300,
      easing: (t) => --t * t * t + 1,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* 📌 Overlay with Blur Effect */}
      {isOpen && (
        <TouchableOpacity
          className="absolute top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-10"
          onPress={onClose}
          activeOpacity={1}
        />
      )}

      {/* 📌 Sliding Drawer */}
      <Animated.View
        style={{ transform: [{ translateX: slideAnim }] }}
        className="absolute left-0 top-0 w-[70%] h-full bg-[#1D3D47] z-20 shadow-lg rounded-tr-3xl rounded-br-3xl px-6 py-16"
      >
        {/* 🔻 Close Button */}
        <TouchableOpacity
          className="absolute top-6 right-6 p-2"
          onPress={onClose}
        >
          <FontAwesome name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* 🔻 User Info */}
        <View className="items-center mb-8">
          <FontAwesome name="user-circle" size={60} color="white" />
          <Text className="text-xl text-white font-semibold mt-3">
            {user?.user_metadata.email || "User"}
          </Text>
        </View>

        {/* 🔻 Navigation Items */}
        <TouchableOpacity
          className="flex-row items-center py-5 border-b border-white/20"
          onPress={() => {
            router.push("/profile");
            onClose();
          }}
        >
          <FontAwesome name="user" size={22} color="white" />
          <Text className="text-lg text-white font-medium ml-4">Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-5 border-b border-white/20"
          onPress={() => {
            router.push("/settings");
            onClose();
          }}
        >
          <FontAwesome name="cog" size={22} color="white" />
          <Text className="text-lg text-white font-medium ml-4">Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-5"
          onPress={() => {
            signOut();
            router.push("/auth");
            onClose();
          }}
        >
          <FontAwesome name="sign-out" size={22} color="white" />
          <Text className="text-lg text-white font-medium ml-4">Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-5"
          onPress={() => {
            signOut();
            router.push("/about");
            onClose();
          }}
        >
          <FontAwesome name="info" size={22} color="white" />
          <Text className="text-lg text-white font-medium ml-4">About</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
