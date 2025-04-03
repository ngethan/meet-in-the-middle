import { Tabs } from "expo-router";
import { Home, MessageSquare, Calendar } from "lucide-react-native";
import { View, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function TabsNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#3b82f6",
          position: "absolute",
          height: 80,
          paddingTop: 4,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          height: 64,
          padding: 8,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-white/20" : ""}`}
            >
              <Home size={24} color="white" strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-white/20" : ""}`}
            >
              <MessageSquare size={24} color="white" strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="eventdash"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-white/20" : ""}`}
            >
              <Calendar size={24} color="white" strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
