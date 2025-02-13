import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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

export default function NavigationDrawer({ onClose, isOpen }: NavigationDrawerProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current; // Start offscreen
  const {user, signOut} = useAuth();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -width * 0.7,
      duration: 300,
      easing: (t) => (--t) * t * t + 1, // Smooth ease-out
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* Overlay with blur effect */}
      {isOpen && (
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.profileContainer}>
          <FontAwesome name="user-circle" size={50} color="white" />
          <Text style={styles.username}>{user?.user_metadata.email || "User"}</Text>
        </View>

        {/* Navigation Items */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            router.push("/profile");
            onClose();
          }}
        >
          <FontAwesome name="user" size={22} color="white" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            router.push("/settings");
            onClose();
          }}
        >
          <FontAwesome name="cog" size={22} color="white" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            signOut();
            router.push("/auth");
            onClose();
          }
          }
        >
          <FontAwesome name="sign-out" size={22} color="white" />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark semi-transparent overlay
    zIndex: 1,
  },
  drawer: {
    width: width * 0.7, // 70% screen width
    height: height,
    backgroundColor: "#1D3D47", // Dark blue-green
    paddingVertical: 40,
    paddingHorizontal: 25,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 2,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)", // Subtle divider
  },
  navText: {
    fontSize: 18,
    marginLeft: 15,
    color: "white",
    fontWeight: "500",
  },
});

