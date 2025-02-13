import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Handle Logout with Confirmation
  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", onPress: signOut },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Profile Picture */}
        <Image
          source={{
            uri: user?.user_metadata?.avatar_url || "https://via.placeholder.com/100",
          }}
          style={styles.profileImage}
        />

        {/* Name */}
        <Text style={styles.name}>{user?.user_metadata?.full_name || "User"}</Text>

        {/* Email */}
        <Text style={styles.email}>{user?.email}</Text>

        {/* Edit Profile Button */}
        {/* <TouchableOpacity style={styles.editButton} onPress={() => router.push("/edit-profile")}>
          <FontAwesome name="pencil" size={16} color="#FFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity> */}
      </View>

      {/* Account Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <FontAwesome name="user" size={18} color="#444" />
          <Text style={styles.detailText}>Full Name: {user?.user_metadata?.full_name || "N/A"}</Text>
        </View>

        <View style={styles.detailRow}>
          <FontAwesome name="envelope" size={18} color="#444" />
          <Text style={styles.detailText}>Email: {user?.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <FontAwesome name="id-card" size={18} color="#444" />
          <Text style={styles.detailText}>User ID: {user?.id}</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color="#FFF" />
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    paddingTop: 40,
  },
  profileCard: {
    backgroundColor: "#007bff",
    borderRadius: 15,
    alignItems: "center",
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFF",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  email: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0056b3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  detailsContainer: {
    backgroundColor: "#FFF",
    width: "90%",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#444",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
});

