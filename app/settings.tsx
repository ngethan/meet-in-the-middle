import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
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
} from "lucide-react-native";
import * as Localization from "expo-localization";
import { Picker } from "@react-native-picker/picker";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState(Localization.locale);

  // Toggle Settings
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleEmailNotifications = () =>
    setEmailNotifications(!emailNotifications);
  const togglePushNotifications = () =>
    setPushNotifications(!pushNotifications);

  // Change Password Function
  const changePassword = async () => {
    Alert.prompt(
      "Change Password",
      "Enter a new password:",
      async (password) => {
        if (!password) return Alert.alert("Error", "Password cannot be empty");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) Alert.alert("Error", error.message);
        else Alert.alert("Success", "Password changed successfully!");
      },
      "secure-text",
    );
  };

  // Delete Account Confirmation
  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.admin.deleteUser(user.id);
            if (error) Alert.alert("Error", error.message);
            else {
              Alert.alert("Deleted", "Your account has been removed.");
              signOut();
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View className="absolute top-2r left-5">
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={32} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.settingsTitle}>Settings</Text>

      {/* Profile */}
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => router.push("/profile")}
      >
        <User size={22} color="#444" />
        <Text style={styles.settingText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Change Password */}
      <TouchableOpacity style={styles.settingItem} onPress={changePassword}>
        <Lock size={22} color="#444" />
        <Text style={styles.settingText}>Change Password</Text>
      </TouchableOpacity>

      {/* Notifications */}
      <View style={styles.settingItem}>
        <Bell size={22} color="#444" />
        <Text style={styles.settingText}>Push Notifications</Text>
        <Switch
          value={pushNotifications}
          onValueChange={togglePushNotifications}
        />
      </View>

      <View style={styles.settingItem}>
        <Mail size={22} color="#444" />
        <Text style={styles.settingText}>Email Notifications</Text>
        <Switch
          value={emailNotifications}
          onValueChange={toggleEmailNotifications}
        />
      </View>

      {/* Dark Mode */}
      <View style={styles.settingItem}>
        <Moon size={22} color="#444" />
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      {/* Language Selection */}
      <View style={styles.settingItem}>
        <Globe size={22} color="#444" />
        <Text style={styles.settingText}>Language</Text>
        <Picker
          selectedValue={language}
          onValueChange={(itemValue: any) => setLanguage(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Español" value="es" />
          <Picker.Item label="Français" value="fr" />
          <Picker.Item label="Deutsch" value="de" />
        </Picker>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          signOut();
          router.push("/auth");
        }}
      >
        <LogOut size={22} color="#FFF" />
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
        <Trash2 size={22} color="#FFF" />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
    top: 50,
  },
  settingsTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: "space-between",
  },
  settingText: {
    fontSize: 18,
    flex: 1,
    marginLeft: 10,
    color: "#444",
  },
  picker: {
    width: Platform.OS === "ios" ? "40%" : "30%",
    backgroundColor: "#FFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9534f",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    justifyContent: "center",
    elevation: 3,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a94442",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: "center",
    elevation: 3,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
  },
});
