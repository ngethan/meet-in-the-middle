import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import {
  ArrowLeft,
  UserCircle,
  User,
  Settings,
  LogOut,
  Info,
} from "lucide-react-native";
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
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const { user, signOut } = useAuth();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -width,
      duration: 300,
      easing: (t) => --t * t * t + 1,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const AnimatedIcon = Animated.createAnimatedComponent(ArrowLeft);

  return (
    <>
      {/* 📌 Overlay with Blur Effect */}
      {isOpen && (
        <TouchableOpacity
          className="absolute top-0 left-0 w-full h-full backdrop-blur-sm z-10"
          onPress={onClose}
          activeOpacity={1}
        />
      )}

      {/* 📌 Sliding Drawer */}
      <Animated.View
        style={{ transform: [{ translateX: slideAnim }] }}
        className="absolute left-0 top-0 h-full bg-white z-20 shadow-lg rounded-tr-3xl rounded-br-3xl px-6 py-16"
      >
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-ios-4 pt-14 pb-4 bg-white border-b border-neutral-100">
            {/* <AnimatedIcon
              size={24}
              color="#007AFF"
              style={{
                transform: [
                  {
                    rotate: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              }}
            /> */}
          </View>

          <View className="p-ios-4">
            <View className="items-center space-y-4">
              <UserCircle size={72} color="#007AFF" strokeWidth={1.5} />
              <Text className="text-xl font-semibold text-neutral-900">
                {user?.user_metadata.email || "User"}
              </Text>
            </View>

            <View className="mt-8 space-y-2">
              <TouchableOpacity
                className="flex-row items-center p-ios-3 rounded-ios active:bg-neutral-100"
                onPress={() => {
                  router.push("/profile");
                  onClose();
                }}
              >
                <User size={22} color="#007AFF" strokeWidth={1.5} />
                <Text className="ml-3 text-base text-neutral-900">Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-ios-3 rounded-ios active:bg-neutral-100"
                onPress={() => {
                  router.push("/settings");
                  onClose();
                }}
              >
                <Settings size={22} color="#007AFF" strokeWidth={1.5} />
                <Text className="ml-3 text-base text-neutral-900">
                  Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-ios-3 rounded-ios active:bg-neutral-100"
                onPress={() => {
                  signOut();
                  router.push("/auth");
                  onClose();
                }}
              >
                <LogOut size={22} color="#007AFF" strokeWidth={1.5} />
                <Text className="ml-3 text-base text-neutral-900">Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-ios-3 rounded-ios active:bg-neutral-100"
                onPress={() => {
                  router.push("/about");
                  onClose();
                }}
              >
                <Info size={22} color="#007AFF" strokeWidth={1.5} />
                <Text className="ml-3 text-base text-neutral-900">About</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
