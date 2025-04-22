import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Switch } from "react-native-paper";
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Mail,
  Moon,
  Globe,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import * as Localization from "expo-localization";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState(
    Localization.locale.split("-")[0] || "en",
  );
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    // Animate settings items on load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Toggle Settings with haptic feedback
  const toggleDarkMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkMode(!darkMode);
  };

  const toggleEmailNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmailNotifications(!emailNotifications);
  };

  const togglePushNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPushNotifications(!pushNotifications);
  };

  // Change Password Function
  const changePassword = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.prompt(
      "Change Password",
      "Enter a new password:",
      async (password) => {
        if (!password) return Alert.alert("Error", "Password cannot be empty");

        setIsLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsLoading(false);

        if (error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Error", error.message);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Success", "Password changed successfully!");
        }
      },
      "secure-text",
    );
  };

  // Delete Account Confirmation
  const deleteAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Account",
      "This action is irreversible. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            const { error } = await supabase.auth.admin.deleteUser(user.id);
            setIsLoading(false);

            if (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", error.message);
            } else {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              Alert.alert("Deleted", "Your account has been removed.");
              signOut();
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        onPress: () => {
          signOut();
          router.push("/auth");
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 p-5"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between mt-12 mb-5">
        <TouchableOpacity
          className="p-2 rounded-xl bg-gray-100"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        <View className="w-10" />
      </View>

      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-500 mb-3 ml-1">
            Account
          </Text>

          {/* Profile */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile");
            }}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <User size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Edit Profile
            </Text>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm"
            onPress={changePassword}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Lock size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Change Password
            </Text>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-500 mb-3 ml-1">
            Preferences
          </Text>

          {/* Notifications */}
          <View className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm">
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Bell size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Push Notifications
            </Text>
            <Switch
              value={pushNotifications}
              onValueChange={togglePushNotifications}
              trackColor={{ false: "#e0e0e0", true: "#bfdbfe" }}
              thumbColor={pushNotifications ? "#3b82f6" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          <View className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm">
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Mail size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Email Notifications
            </Text>
            <Switch
              value={emailNotifications}
              onValueChange={toggleEmailNotifications}
              trackColor={{ false: "#e0e0e0", true: "#bfdbfe" }}
              thumbColor={emailNotifications ? "#3b82f6" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          {/* Dark Mode */}
          <View className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm">
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Moon size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Dark Mode
            </Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#e0e0e0", true: "#bfdbfe" }}
              thumbColor={darkMode ? "#3b82f6" : "#f4f3f4"}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          {/* Language Selection */}
          <View className="flex-row items-center bg-white p-4 rounded-2xl mb-2.5 shadow-sm">
            <View className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Globe size={20} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">
              Language
            </Text>
            <View className="w-[120px] overflow-hidden">
              <Picker
                selectedValue={language}
                onValueChange={(itemValue) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage(itemValue);
                }}
                style={{
                  width: 120,
                  height: Platform.OS === "ios" ? 100 : 40,
                  marginRight: Platform.OS === "ios" ? -10 : 0,
                }}
                dropdownIconColor="#999"
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Español" value="es" />
                <Picker.Item label="Français" value="fr" />
                <Picker.Item label="Deutsch" value="de" />
              </Picker>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-500 mb-3 ml-1">
            Danger Zone
          </Text>

          {/* Sign Out */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-blue-500 p-4 rounded-2xl mt-2.5 shadow-md"
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#FFF" />
            <Text className="text-white text-base font-semibold ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-red-500 p-4 rounded-2xl mt-2.5 shadow-md"
            onPress={deleteAccount}
            activeOpacity={0.8}
          >
            <Trash2 size={20} color="#FFF" />
            <Text className="text-white text-base font-semibold ml-2">
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
