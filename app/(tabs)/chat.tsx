import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  Easing,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthProvider";
import { FontAwesome } from "@expo/vector-icons";
import { randomUUID } from "crypto"; // Native Node.js 16+ alternative
import moment from "moment";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function ChatScreen() {
  const { user } = useAuth(); // Get logged-in user
  const [chats, setChats] = useState<any[]>([]); // Group chats
  const [messages, setMessages] = useState([]); // Messages in selected chat
  const [selectedChat, setSelectedChat] = useState(null); // Active chat
  const [newGroupName, setNewGroupName] = useState(""); // New group name
  const [inviteEmail, setInviteEmail] = useState(""); // Invite user email
  const [isModalVisible, setModalVisible] = useState(false); // Group modal
  const [messageText, setMessageText] = useState("");
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isMembersModalVisible, setMembersModalVisible] = useState(false);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);
  const popupScale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isFabMenuOpen) {
      Animated.timing(popupScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(popupScale, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isFabMenuOpen]);

  useEffect(() => {
    fetchUserGroups();
    fetchChats();
    subscribeToChats();
  }, []);

  /** 📌 Fetch groups where the user is a member */
  async function fetchUserGroups() {
    if (!user) return;

    const { data: groupData, error: groupError } = await supabase
      .from("group_members")
      .select("chat_id")
      .eq("user_id", user.id);

    if (groupError) {
      console.error("Error fetching user groups:", groupError);
      return;
    }

    const groupIds = groupData.map((group) => group.chat_id);

    if (groupIds.length > 0) {
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      if (!chatsError) setChats(chatsData);
    }
  }

  const nonCryptoUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  /** 📌 Fetch group members */
  const fetchGroupMembers = async () => {
    if (!selectedChat) return;

    const { data, error } = await supabase
      .from("group_members")
      .select("user_id, users (full_name, email)")
      .eq("chat_id", selectedChat.id)
      .order("joined_at", { ascending: true });

    if (!error) {
      setGroupMembers(data.map((member) => member.users));
      setMembersModalVisible(true);
    } else {
      Alert.alert("Error", "Failed to fetch group members.");
    }
  };

  const handleFabOption = (option: any) => {
    switch (option) {
      case "invite":
        setInviteModalVisible(true);
        break;
      case "members":
        fetchGroupMembers();
        break;
      case "trips":
        router.push({
          pathname: "/trips",
          params: { chatId: selectedChat.id, chatName: selectedChat.name },
        });
        break;
      default:
        break;
    }
    setFabMenuOpen(false);
  };

  /** 📌 Subscribe to real-time chat updates */
  function subscribeToChats() {
    return supabase
      .channel("chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        fetchUserGroups,
      )
      .subscribe();
  }

  /** 📌 Fetch messages for a selected chat */
  async function fetchMessages(chatId: any) {
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return;
    }

    // Get unique user IDs from messages
    const userIds = [...new Set(messagesData.map((msg) => msg.user_id))];

    // Fetch user details (full_name) from users table
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return;
    }

    // Create a map of user_id -> full_name
    const userMap: { [key: string]: string } = {};
    usersData.forEach((user) => {
      userMap[user.id] = user.full_name;
    });

    // Map messages to include full_name instead of email
    setMessages(
      messagesData.map((msg) => ({
        _id: msg.id,
        text: msg.text,
        createdAt: new Date(msg.created_at),
        user: {
          _id: msg.user_id,
          name: userMap[msg.user_id] || "Unknown User", // Fallback if name is missing
        },
      })),
    );
  }

  async function fetchChats() {
    try {
      // ✅ Step 1: Get all chat groups where the user is a member
      const { data: userChats, error: userChatsError } = await supabase
        .from("group_members")
        .select("chat_id")
        .eq("user_id", user.id);

      if (userChatsError) throw userChatsError;

      // Extract chat IDs
      const chatIds = userChats.map((item) => item.chat_id);

      console.log(user.id, "   ", chatIds);
      if (chatIds.length === 0) {
        setChats([]); // If user isn't in any chats, reset state
        return;
      }

      // ✅ Step 2: Fetch chat group details
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds)
        .order("created_at", { ascending: false });

      if (chatsError) throw chatsError;

      // ✅ Step 3: Fetch latest messages for each chat
      const chatsWithLatestMessages = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: latestMessages, error: messagesError } = await supabase
            .from("messages")
            .select("text, created_at, user_id")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false }) // Get latest first
            .limit(1);

          if (messagesError) console.error(messagesError);

          const latestMessage = latestMessages?.[0] || null;

          let formattedMessage = "No messages yet";
          let timestamp = "";

          if (latestMessage) {
            // ✅ Fetch sender's full name
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", latestMessage.user_id)
              .single();

            const senderName = userData?.full_name || "Unknown";

            formattedMessage = `${senderName}: ${latestMessage.text}`;
            timestamp = latestMessage.created_at;
          }

          return {
            ...chat,
            lastMessage: formattedMessage,
            lastMessageTime: timestamp,
          };
        }),
      );

      setChats(chatsWithLatestMessages);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !messageText.trim()) return;

    // Fetch the user's full name from the 'users' table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name") // Assuming the column name is 'full_name'
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user full name:", userError);
      return;
    }

    const userName = userData.full_name || "Unknown User"; // Fallback in case the name is missing
    const newMessage = {
      chat_id: selectedChat.id,
      user_id: user.id,
      text: messageText.trim(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("messages").insert([newMessage]);

    if (!error) {
      setMessages((prev: any) => [
        ...prev,
        {
          _id: newMessage.chat_id,
          text: newMessage.text,
          user: { _id: user.id, name: userName },
          createdAt: new Date(),
        },
      ]);
      setMessageText("");
    } else {
      console.error("Error sending message:", error);
    }
  };

  /** 📌 Select chat and load messages */
  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  /** 📌 Create new group chat */
  const handleCreateGroup = async () => {
    if (!newGroupName.trim())
      return Alert.alert("Error", "Group name cannot be empty");

    const newGroupId = nonCryptoUUID();
    const { error } = await supabase.from("chats").insert([
      {
        id: newGroupId,
        name: newGroupName,
        created_at: new Date().toISOString(),
      },
    ]);

    const { error: memberError } = await supabase.from("group_members").insert([
      {
        chat_id: newGroupId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
      },
    ]);

    if (!error && !memberError) {
      setNewGroupName("");
      setModalVisible(false);
      fetchUserGroups();
      handleSelectChat({ id: newGroupId, name: newGroupName });
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

  return (
    <View className="flex-1 bg-gray-100">
      {/* 📌 Header */}
      <View className="flex-row justify-between items-center px-6 py-16 bg-white shadow-lg border-b border-gray-200">
        {selectedChat && (
          <TouchableOpacity
            onPress={() => {
              setSelectedChat(null);
              setMessages([]);
              setMessageText("");
            }}
            className="p-2"
          >
            <FontAwesome name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-800">
          {selectedChat ? selectedChat.name : "Messages"}
        </Text>
        {selectedChat && (
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              setFabMenuOpen(true);
            }}
          >
            <FontAwesome name="ellipsis-v" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📌 Chat List */}
      {!selectedChat ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl p-4 mx-4 my-4 shadow-md border border-gray-200 hover:shadow-lg"
              onPress={() => handleSelectChat(item)}
            >
              <Text className="text-lg font-bold text-gray-900">
                {item.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {item.lastMessage || "No messages yet..."}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View className="flex-1">
          {/* 📌 Chat Messages */}
          <ScrollView className="flex-1 px-4 py-2">
            {messages.map((msg) => {
              const isMyMessage = msg.user._id === user.id;
              return (
                <View
                  key={msg._id}
                  className={`p-3 rounded-xl my-2 max-w-[75%] ${
                    isMyMessage
                      ? "bg-yellow-400 self-end shadow-lg"
                      : "bg-gray-200 self-start"
                  }`}
                >
                  <Text className="text-sm font-bold">{msg.user.name}</Text>
                  <Text className="text-base">{msg.text}</Text>
                  <Text className="text-xs text-gray-600 self-end mt-1">
                    {moment(msg.createdAt).format("hh:mm A")}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* 📌 Send Message Input */}
          <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-300 pb-40">
            <TextInput
              className="flex-1 p-3 bg-gray-100 rounded-full text-base border border-gray-300"
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity
              className="ml-3 p-3 bg-orange-500 rounded-full shadow-lg"
              onPress={handleSendMessage}
            >
              <FontAwesome name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 📌 Create Group Button */}
      {!selectedChat && (
        <TouchableOpacity
          className="absolute bottom-40 right-6 bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome name="plus" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* 📌 Pop-Up Menu */}
      <Animated.View
        className="absolute top-28 right-6 bg-white shadow-lg rounded-lg p-3 space-y-2"
        style={{
          transform: [{ scale: popupScale }],
          opacity: popupScale,
        }}
      >
        <TouchableOpacity
          onPress={() => handleFabOption("invite")}
          className="flex-row items-center space-x-3 p-2 rounded-lg bg-gray-50 active:bg-gray-100"
          activeOpacity={0.7}
        >
          <FontAwesome name="user-plus" size={22} color="black" />
          <Text className="text-base text-gray-800 px-3">Invite User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFabOption("members")}
          className="flex-row items-center space-x-3 p-2 rounded-lg bg-gray-50 active:bg-gray-100"
          activeOpacity={0.7}
        >
          <FontAwesome name="users" size={22} color="black" />
          <Text className="text-base text-gray-800 px-3">See Members</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFabOption("trips")}
          className="flex-row items-center px-3 p-2 rounded-lg bg-gray-50 active:bg-gray-100"
          activeOpacity={0.7}
        >
          <FontAwesome name="map" size={22} color="black" />
          <Text className="text-base text-gray-800 px-3">Trips</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 📌 Group Members Modal */}
      <Modal visible={isMembersModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
          <View className="bg-white w-[85%] rounded-2xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Group Members
            </Text>

            {groupMembers.length > 0 ? (
              <ScrollView className="max-h-[300px]">
                {groupMembers.map((member: any, index: any) => (
                  <View
                    key={index}
                    className="bg-gray-100 p-3 rounded-lg mb-2 shadow-sm"
                  >
                    <Text className="text-lg font-semibold text-gray-800">
                      {member.full_name || member.email}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-center text-gray-500 text-sm">
                No members found
              </Text>
            )}

            <TouchableOpacity
              className="mt-5 bg-gray-300 py-3 w-full rounded-xl"
              onPress={() => setMembersModalVisible(false)}
            >
              <Text className="text-gray-800 font-bold text-center text-lg">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📌 Create Group Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
          <View className="bg-white w-[85%] h-[24%] rounded-2xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Create New Group
            </Text>
            <TextInput
              className="w-full p-5 bg-gray-100 rounded-xl text-lg border border-gray-300"
              placeholder="Enter group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                className="bg-orange-500 py-3 w-[48%] rounded-xl shadow-lg"
                onPress={handleCreateGroup}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Create
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-300 py-3 w-[48%] rounded-xl"
                onPress={() => {
                  setModalVisible(false);
                  setNewGroupName("");
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
      {/* 📌 Invite User Modal */}
      <Modal visible={isInviteModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
          <View className="bg-white w-[85%] rounded-2xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Invite User
            </Text>
            <TextInput
              className="w-full p-3 bg-gray-100 rounded-xl text-lg border border-gray-300"
              placeholder="Enter user email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                className="bg-orange-500 py-3 w-[48%] rounded-xl shadow-lg"
                onPress={handleInviteUser}
              >
                <Text className="text-white font-bold text-center text-lg">
                  Invite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-300 py-3 w-[48%] rounded-xl"
                onPress={() => setInviteModalVisible(false)}
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
