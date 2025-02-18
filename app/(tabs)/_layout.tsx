import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

export default function TabsNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false, // ✅ Hide Header
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <FontAwesome name="home" size={24} color={focused ? "#fff" : "#333"} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false, // ✅ Hide Header
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <FontAwesome name="comments" size={24} color={focused ? "#fff" : "#333"} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#F5F5F5",
    height: "12%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 5,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 20,
  },
  iconActive: {
    backgroundColor: "#ffbb33",
  },
});
