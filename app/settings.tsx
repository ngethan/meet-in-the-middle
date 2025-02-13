import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Switch, 
  Alert 
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Toggle Dark Mode
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Toggle Email Notifications
  const toggleEmailNotifications = () => setEmailNotifications(!emailNotifications);

  // Toggle Push Notifications
  const togglePushNotifications = () => setPushNotifications(!pushNotifications);

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
      "secure-text"
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
              signOut(); // Sign out the user
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.settingsTitle}>Settings</Text>

      {/* Profile */}
      <TouchableOpacity style={styles.settingItem} onPress={() => router.push("/profile")}>
        <FontAwesome name="user" size={22} color="#444" />
        <Text style={styles.settingText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Change Password */}
      <TouchableOpacity style={styles.settingItem} onPress={changePassword}>
        <FontAwesome name="lock" size={22} color="#444" />
        <Text style={styles.settingText}>Change Password</Text>
      </TouchableOpacity>

      {/* Notifications Settings */}
      <View style={styles.settingItem}>
        <FontAwesome name="bell" size={22} color="#444" />
        <Text style={styles.settingText}>Push Notifications</Text>
        <Switch value={pushNotifications} onValueChange={togglePushNotifications} />
      </View>

      <View style={styles.settingItem}>
        <FontAwesome name="envelope" size={22} color="#444" />
        <Text style={styles.settingText}>Email Notifications</Text>
        <Switch value={emailNotifications} onValueChange={toggleEmailNotifications} />
      </View>

      {/* Dark Mode */}
      <View style={styles.settingItem}>
        <FontAwesome name="moon-o" size={22} color="#444" />
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
        <FontAwesome name="sign-out" size={22} color="#FFF" />
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
        <FontAwesome name="trash" size={22} color="#FFF" />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
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
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9534f",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: "center",
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
    borderRadius: 10,
    marginTop: 10,
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
  },
});

