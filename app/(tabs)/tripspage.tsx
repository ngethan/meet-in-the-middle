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
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Calendar, Clock, Trash2 } from "lucide-react-native";
import * as Location from "expo-location";
import { useAuth } from "@/context/AuthProvider";
import moment from "moment";
import { FontAwesome } from "@expo/vector-icons";
import { Menu, UserCircle2Icon } from "lucide-react-native";
import NavigationDrawer from "../../components/Drawer";

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
  const [newGroupName, setNewGroupName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [chatId, setChatId] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    try {
      setIsLoading(true); // Start loading indicator

      // 1. Get conversationParticipant rows for the current user
      const { data: userChats, error: userChatsError } = await supabase
        .from("conversationParticipants")
        .select("conversationId") // Only select the needed column
        .eq("userId", user.id);

      if (userChatsError) {
        throw new Error(
          `Failed to fetch user chat groups: ${userChatsError.message}`,
        );
      }
      if (!userChats) {
        setChats([]); // Handle case where user isn't in any conversations
        setIsLoading(false);
        return;
      }

      // 2. Extract UNIQUE conversation IDs
      const conversationIds = userChats.map((item) => item.conversationId);
      const uniqueConversationIds = [...new Set(conversationIds)]; // Ensure uniqueness

      if (uniqueConversationIds.length === 0) {
        setChats([]); // If user isn't in any chats after filtering
        setIsLoading(false);
        return;
      }

      // 3. Fetch the actual conversation details for those UNIQUE IDs
      const { data: chatsData, error: chatsError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", uniqueConversationIds); // Use unique IDs

      if (chatsError) {
        throw new Error(`Failed to fetch chat details: ${chatsError.message}`);
      }
      if (!chatsData) {
        console.warn(
          "No chat data found for unique IDs:",
          uniqueConversationIds,
        );
        setChats([]); // Handle case where chats might have been deleted
        setIsLoading(false);
        return;
      }

      // 4. Fetch all trips associated with these unique conversations
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select(`*`)
        .in("conversationId", uniqueConversationIds) // Fetch trips for unique chats
        .order("startDate", { ascending: false });

      if (tripsError) {
        // Log error but potentially continue without trips if desired
        console.error(`Failed to fetch trip details: ${tripsError.message}`);
        // Depending on requirements, you might throw the error or proceed
        // throw new Error(`Failed to fetch trip details: ${tripsError.message}`);
      }

      // 5. Map trips to their respective (unique) chats
      const chatsWithTripDetails = chatsData.map((chat) => {
        // Iterate unique chats
        const matchingTrips =
          tripsData?.filter((trip) => trip.conversationId === chat.id) || [];
        return {
          ...chat, // Spread unique chat details
          trips: matchingTrips,
        };
      });

      // 6. Update state with the array containing unique chats
      setChats(chatsWithTripDetails);
    } catch (error: any) {
      console.error("Error fetching chats:", error);
      // Consider showing a user-friendly error message
      // Alert.alert("Error", "Failed to load trip data. Please try again later.");
    } finally {
      setIsLoading(false); // End loading indicator
    }
  }

  /** 📌 Create new group chat */
  const handleCreateGroup = async () => {
    if (!newGroupName.trim())
      return Alert.alert("Error", "Group name cannot be empty");

    const newGroupId = nonCryptoUUID();
    const { error } = await supabase.from("conversations").insert([
      {
        id: newGroupId,
        chatName: newGroupName,
        lastDate: new Date().toISOString(),
        participantIds: [user.id],
        ownerId: user.id,
        lastMessage: "",
      },
    ]);

    const { error: memberError } = await supabase
      .from("conversationParticipants")
      .insert([
        {
          id: nonCryptoUUID(),
          conversationId: newGroupId,
          userId: user.id,
          lastDate: new Date().toISOString(),
        },
      ]);

    console.log("Success");

    if (!error && !memberError) {
      setNewGroupName("");
      setIsModalVisible(false);
      fetchChats();
    }
  };

  /** 📌 Invite user to group */
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedChat)
      return Alert.alert("Error", "Enter a valid email");

    // Get invited user's ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", inviteEmail)
      .single();

    if (userError || !userData) return Alert.alert("Error", "User not found");

    // Check if the user is already in the group
    const { data: existingMember, error: memberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("chat_id", selectedChat.id)
      .eq("user_id", userData.id)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      return Alert.alert("Error", "Failed to check group membership");
    }

    if (existingMember) {
      return Alert.alert("Info", "User already in the group");
    }

    // Add user to group
    const { error } = await supabase.from("group_members").insert([
      {
        chat_id: selectedChat.id,
        user_id: userData.id,
        joined_at: new Date().toISOString(),
      },
    ]);

    if (!error) {
      setInviteEmail("");
      setInviteModalVisible(false);
      Alert.alert("Success", "User invited to the group!");
    } else {
      Alert.alert("Error", "Failed to add user to group");
    }
  };

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
    console.log("members", members);

    // ✅ Step 3: Add all users to the trip
    const participantsData = members.map((member) => ({
      id: nonCryptoUUID(), // Unique ID for each participant
      tripId: newTripId,
      userId: member.userId,
      startingLocation: null, // Default value
      latitude: 0.0, // Default
      longitude: 0.0, // Default
      joinedAt: new Date().toISOString(),
      preferences: [],
    }));

    console.log("participantsData", participantsData);

    const { error: participantsError } = await supabase
      .from("tripParticipants")
      .insert(participantsData);

    console.log("participantsError", participantsError);

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
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-16 pb-4 bg-white shadow-sm border-b border-gray-100">
        <Text className="text-xl text-black">My Trips</Text>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center active:bg-gray-100"
        >
          <UserCircle2Icon size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600 font-medium">
            Loading trips...
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Image
            source={{
              uri: "https://img.icons8.com/clouds/100/000000/suitcase.png",
            }}
            className="w-32 h-32 mb-6"
          />
          <Text className="text-xl font-semibold text-gray-700 text-center mb-2">
            No trips yet
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            Create your first group to start planning amazing adventures
          </Text>
          <TouchableOpacity
            className="bg-blue-400 py-4 px-8 rounded-full shadow-md"
            onPress={() => setIsModalVisible(true)}
          >
            <Text className="text-white font-bold text-lg">Create Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          className="flex-1 w-full"
          data={chats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexGrow: 1,
          }}
          renderItem={({ item: chat }) => (
            <View className="mb-8 bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Chat header */}
              <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <TouchableOpacity
                  className="flex-1 flex-row items-center"
                  onPress={() => {
                    router.push({
                      pathname: "/chatbox/[id]",
                      params: { id: chat.id },
                    });
                  }}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-400 items-center justify-center mr-3">
                    <Text className="text-white font-bold text-lg">
                      {chat.chatName.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-800">
                    {chat.chatName}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5 rounded-full shadow-sm"
                    onPress={() => {
                      setChatId(chat.id);
                      setTripModalVisible(true);
                    }}
                  >
                    <Plus size={22} color="black" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-red-500 p-2.5 rounded-full shadow-sm"
                    onPress={() => handleDeleteChat(chat.id)}
                  >
                    <Trash2 size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Trips for this chat */}
              <View className="py-3">
                {chat.trips && chat.trips.length > 0 ? (
                  <FlatList
                    data={chat.trips}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        key={`trip-${item.id}`}
                        className="bg-white rounded-2xl shadow-md border border-gray-200 mx-2 overflow-hidden"
                        style={{
                          width: 300,
                          height: 380,
                          elevation: 3,
                        }}
                        onPress={() => {
                          router.push({
                            pathname: "/trip/[id]",
                            params: { id: item.id },
                          });
                        }}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{
                            uri:
                              item.bestPhotos && item.bestPhotos[0]
                                ? item.bestPhotos[0]
                                : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1035&q=80",
                          }}
                          className="w-full h-[55%]"
                          style={{ resizeMode: "cover" }}
                        />

                        <View className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-black/40 to-transparent" />

                        <View className="p-4">
                          <Text className="text-xl font-bold text-gray-800 mb-2">
                            {item.name}
                          </Text>

                          <View className="flex-row items-center mb-2">
                            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                              <FontAwesome
                                name="calendar"
                                size={16}
                                color="#3b82f6"
                              />
                            </View>
                            <View>
                              <Text className="text-sm text-gray-600">
                                {moment(item.startDate).format("MMM DD, YYYY")}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {moment(item.startDate).format("h:mm A")}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-2">
                              <FontAwesome
                                name="flag-checkered"
                                size={16}
                                color="#6366f1"
                              />
                            </View>
                            <View>
                              <Text className="text-sm text-gray-600">
                                {moment(item.endDate).format("MMM DD, YYYY")}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {moment(item.endDate).format("h:mm A")}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            className="mt-3 bg-blue-400 py-2.5 rounded-xl"
                            onPress={() => {
                              router.push({
                                pathname: "/trip/[id]",
                                params: { id: item.id },
                              });
                            }}
                          >
                            <Text className="text-white font-semibold text-center">
                              View Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View className="py-6 px-4 items-center">
                    <Text className="text-gray-500 text-center mb-2">
                      No trips in this group yet
                    </Text>
                    <TouchableOpacity
                      className="bg-blue-100 py-2 px-4 rounded-full"
                      onPress={() => {
                        setChatId(chat.id);
                        setTripModalVisible(true);
                      }}
                    >
                      <Text className="text-blue-600 font-medium">
                        Add Trip
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Create Group Button */}
      {chats.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-28 right-6 bg-blue-400 w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
          style={{
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Create Trip Modal */}
      <Modal visible={tripModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/60 backdrop-blur-md">
          <View className="bg-white w-[90%] rounded-3xl p-6 shadow-2xl">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create a New Trip
            </Text>

            {/* Trip Name Input */}
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Trip Name
            </Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200 mb-5 flex-row items-center px-3">
              <FontAwesome name="suitcase" size={20} color="#6366f1" />
              <TextInput
                className="flex-1 p-4 text-base text-gray-800"
                placeholder="Enter Trip Name"
                value={newTripName}
                onChangeText={setNewTripName}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Start Date Picker */}
            <Text className="text-base font-semibold text-gray-700 mb-2">
              Start Date & Time
            </Text>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl border border-gray-200 mb-5 flex-row items-center p-3"
              onPress={() => setShowStartPicker(true)}
            >
              <FontAwesome
                name="calendar"
                size={20}
                color="#3b82f6"
                className="mr-3"
              />
              <Text className="text-gray-800 text-base p-2">
                {moment(startDate).format("MMMM DD, YYYY - hh:mm A")}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) =>
                  handleDateChange(event, selectedDate, true)
                }
              />
            )}

            {/* End Date Picker */}
            <Text className="text-base font-semibold text-gray-700 mb-2">
              End Date & Time
            </Text>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl border border-gray-200 mb-6 flex-row items-center p-3"
              onPress={() => setShowEndPicker(true)}
            >
              <FontAwesome
                name="flag-checkered"
                size={20}
                color="#6366f1"
                className="mr-3"
              />
              <Text className="text-gray-800 text-base p-2">
                {moment(endDate).format("MMMM DD, YYYY - hh:mm A")}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) =>
                  handleDateChange(event, selectedDate, false)
                }
              />
            )}

            {/* Create & Cancel Buttons */}
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-blue-400 py-4 w-[48%] rounded-xl shadow-md"
                onPress={handleCreateTrip}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Create Trip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 py-4 w-[48%] rounded-xl"
                onPress={() => {
                  setTripModalVisible(false);
                  setNewTripName("");
                }}
                activeOpacity={0.8}
              >
                <Text className="text-gray-700 font-bold text-center text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/60 backdrop-blur-md">
          <View className="bg-white w-[90%] rounded-3xl p-6 shadow-2xl">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create New Group
            </Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200 mb-6 flex-row items-center px-3">
              <FontAwesome name="users" size={20} color="#6366f1" />
              <TextInput
                className="flex-1 p-4 text-base text-gray-800"
                placeholder="Enter group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-blue-400 py-4 w-[48%] rounded-xl shadow-md"
                onPress={handleCreateGroup}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Create Group
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 py-4 w-[48%] rounded-xl"
                onPress={() => {
                  setIsModalVisible(false);
                  setNewGroupName("");
                }}
                activeOpacity={0.8}
              >
                <Text className="text-gray-700 font-bold text-center text-lg">
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
