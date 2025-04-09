import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Calendar, Clock, Trash2 } from "lucide-react-native";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthProvider";
import moment from "moment";

const { width } = Dimensions.get("window");

const nonCryptoUUID = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export default function TripsPage() {
  const router = useRouter();
  const [curTrips, setCurTrips] = useState<any[]>([]);
  const [newTripName, setNewTripName] = useState("");
  const [startingLocation, setStartingLocation] = useState("");

  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [chatId, setChatId] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    try {
      // Get all chat groups where the user is a member
      const { data: userChats, error: userChatsError } = await supabase
        .from("conversationParticipants")
        .select("*")
        .eq("userId", user.id);

      const { data: chatsData, error: chatsError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", userChats?.map((item) => item.conversationId) || []);

      if (userChatsError) {
        throw new Error(
          `Failed to fetch user chat groups: ${userChatsError.message}`,
        );
      }

      // Extract chat IDs
      const chatIds = chatsData?.map((item) => item.id) || [];

      if (chatIds.length === 0) {
        setChats([]); // If user isn't in any chats, reset state
        setIsLoading(false);
        return;
      }

      // ✅ Step 2: Fetch chat group details and their trips
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select(`*`)
        .in("conversationId", chatIds)
        .order("startDate", { ascending: false });

      // Map trips data with user chats to get full trip details
      const chatsWithTripDetails =
        chatsData?.map((chat) => {
          const matchingTrips =
            tripsData?.filter((trip) => trip.conversationId === chat.id) || [];
          return {
            ...chat,
            trips: matchingTrips,
          };
        }) || [];

      if (tripsError) {
        throw new Error(
          `Failed to fetch chat group details: ${tripsError.message}`,
        );
      }

      for (const chat of chatsWithTripDetails) {
        console.log("chat", chat);
      }

      setChats(chatsWithTripDetails);
    } catch (error) {
      console.error("Error fetching chats:", error);
      alert("Failed to load chats. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleDateChange = (event: any, selectedDate: any, isStart: any) => {
    if (selectedDate) {
      if (isStart) {
        setStartDate(selectedDate);
        setShowStartPicker(false);
      } else {
        setEndDate(selectedDate);
        setShowEndPicker(false);
      }
    }
  };

  /** 📌 Create a new trip */
  const handleCreateTrip = async () => {
    if (!newTripName.trim()) {
      return Alert.alert("Error", "Trip name required.");
    }

    const newTripId = nonCryptoUUID();
    const newId = nonCryptoUUID();

    const { error } = await supabase.from("trips").insert([
      {
        id: newTripId,
        conversationId: chatId,
        creatorId: user.id,
        name: newTripName,
        createdAt: new Date().toISOString(),
        startDate: startDate.toISOString(), // ✅ Store start date with time
        endDate: endDate.toISOString(), // ✅ Store end date with time
      },
    ]);

    // ✅Fetch all users in the chat
    const { data: members, error: membersError } = await supabase
      .from("conversationParticipants")
      .select("userId")
      .eq("conversationId", chatId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      return Alert.alert("Error", "No users found in this chat.");
    }
    // ✅ Step 3: Add all users to the trip
    const participantsData = members.map((member) => ({
      id: newId, // Unique ID for each participant
      tripId: newTripId,
      userId: member.userId,
      startingLocation: null, // Default value
      latitude: 0.0, // Default
      longitude: 0.0, // Default
      joinedAt: new Date().toISOString(),
    }));

    console.log("Success");

    const { error: participantsError } = await supabase
      .from("tripParticipants")
      .insert(participantsData);

    if (participantsError) throw participantsError;

    if (!error && !participantsError) {
      setNewTripName("");
      setStartingLocation("");
      setTripModalVisible(false);
      fetchChats();
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // First delete all participants in this chat
              const { error: participantsError } = await supabase
                .from("conversationParticipants")
                .delete()
                .eq("conversationId", chatId);

              if (participantsError) throw participantsError;

              // Then delete the chat itself
              const { error: chatError } = await supabase
                .from("conversations")
                .delete()
                .eq("id", chatId);

              if (chatError) throw chatError;

              fetchChats(); // Refresh the chats list
            } catch (error) {
              console.error("Error deleting chat:", error);
              Alert.alert("Error", "Failed to delete chat. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-blue-400 shadow-md">
        <Text className="text-lg font-bold text-gray-800">Trips</Text>
      </View>

      <FlatList
        className="flex-1 w-full"
        data={chats}
        keyExtractor={(item) => item.conversationId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexGrow: 1,
        }}
        renderItem={({ item: chat }) => (
          <View key={chat.conversationId} className="mb-8">
            {/* Chat Header */}
            <View className="flex-row justify-between items-center shadow-sm p-3">
              <TouchableOpacity
                className="flex-1"
                onPress={() => {
                  router.push({
                    pathname: "/chatbox/[id]",
                    params: { id: chat.id },
                  });
                }}
              >
                <Text className="text-xl font-bold text-gray-900">
                  {chat.chatName}
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-blue-500 p-2 rounded-full"
                  onPress={() => {
                    setChatId(chat.id);
                    setTripModalVisible(true);
                  }}
                >
                  <Plus size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-red p-2 rounded-full"
                  onPress={() => handleDeleteChat(chat.id)}
                >
                  <Trash2 size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="h-0.5 bg-gray-200" />

            {/* Trips for this chat */}
            <FlatList
              data={chat.trips}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingVertical: 8,
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-white rounded-2xl shadow-md border border-gray-300 w-300 mx-2"
                  style={{
                    width: 300,
                    height: 400,
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 3 },
                  }}
                  onPress={() => {
                    console.log("item", item.id);
                    router.push({
                      pathname: "/trip/[id]",
                      params: { id: item.id },
                    });
                  }}
                >
                  <Image
                    source={{
                      uri: item.bestPhotos
                        ? item.bestPhotos[0]
                        : "https://www.four-paws.org/our-stories/publications-guides/a-cats-personality",
                    }}
                    className="w-full h-[50%] rounded-t-2xl"
                    style={{ resizeMode: "cover" }}
                  />

                  <View className="p-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {moment(item.startDate).format("MMMM DD, YYYY - hh:mm A")}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {moment(item.endDate).format("MMMM DD, YYYY - hh:mm A")}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      />

      <Modal visible={tripModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
          <View className="bg-white w-[85%] rounded-2xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Create a New Trip
            </Text>

            {/* Trip Name Input */}
            <Text className="text-lg font-semibold mb-2">Trip Name</Text>
            <TextInput
              className="w-full p-4 bg-gray-100 rounded-xl text-lg border border-gray-300 mb-4"
              placeholder="Enter Trip Name"
              value={newTripName}
              onChangeText={setNewTripName}
            />

            {/* 📌 Start Date Picker */}
            <Text className="text-lg font-semibold mb-2">
              Start Date & Time
            </Text>
            <TouchableOpacity
              className="p-4 bg-gray-100 rounded-xl border border-gray-300 mb-4"
              onPress={() => setShowStartPicker(true)}
            >
              <Text className="text-gray-700 text-lg">
                {moment(startDate).format("MMMM DD, YYYY - hh:mm A")}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime" // ✅ Shows both date & time
                display="default"
                onChange={(event, selectedDate) =>
                  handleDateChange(event, selectedDate, true)
                }
              />
            )}

            {/* 📌 End Date Picker */}
            <Text className="text-lg font-semibold mb-2">End Date & Time</Text>
            <TouchableOpacity
              className="p-4 bg-gray-100 rounded-xl border border-gray-300 mb-4"
              onPress={() => setShowEndPicker(true)}
            >
              <Text className="text-gray-700 text-lg">
                {moment(endDate).format("MMMM DD, YYYY - hh:mm A")}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime" // ✅ Shows both date & time
                display="default"
                onChange={(event, selectedDate) =>
                  handleDateChange(event, selectedDate, false)
                }
              />
            )}

            {/* Create & Cancel Buttons */}
            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                className="bg-purple-500 py-3 w-[48%] rounded-xl shadow-lg"
                onPress={handleCreateTrip}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Create
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-300 py-3 w-[48%] rounded-xl"
                onPress={() => {
                  setTripModalVisible(false);
                  setNewTripName("");
                }}
              >
                <Text className="text-gray-800 font-bold text-center text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
