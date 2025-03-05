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
import LoadingOverlay from "../loadingoverlay";

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
  const [isLoading, setIsLoading] = useState(false); // Control loading animation
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
      .from("conversationParticipants")
      .select("conversationId")
      .eq("userId", user.id);

    if (groupError) {
      console.error("Error fetching user groups:", groupError);
      return;
    }

    const groupIds = groupData.map((group) => group.conversationId);

    if (groupIds.length > 0) {
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", groupIds)
        .order("createdAt", { ascending: false });
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
      .from("conversationParticipants")
      .select("userId, users (fullName)")
      .eq("conversationId", selectedChat.id)
      .order("lastDate", { ascending: true });

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
          params: { chatId: selectedChat.id, chatName: selectedChat.chatName },
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
      .eq("conversationId", chatId)
      .order("createdAt", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return;
    }

    // Get unique user IDs from messages
    const userIds = [...new Set(messagesData.map((msg) => msg.senderId))];

    // Fetch user details (full_name) from users table
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, fullName")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return;
    }

    // Create a map of userId -> full_name
    const userMap: { [key: string]: string } = {};
    usersData.forEach((user) => {
      userMap[user.id] = user.fullName;
    });

    // Map messages to include full_name instead of email
    setMessages(
      messagesData.map((msg) => ({
        _id: msg.id || nonCryptoUUID(), // Use msg.id if available; fallback to a generated UUID
        content: msg.content,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.senderId,
          name: userMap[msg.senderId] || "Unknown User", // Fallback if name is missing
        },
      })),
    );
  }
  async function fetchChats() {
    setIsLoading(true);
    try {
      // ✅ Step 1: Get all chat groups where the user is a member
      const { data: userChats, error: userChatsError } = await supabase
        .from("conversationParticipants")
        .select("conversationId")
        .eq("userId", user.id);

      if (userChatsError) {
        throw new Error(
          `Failed to fetch user chat groups: ${userChatsError.message}`,
        );
      }

      // Extract chat IDs
      const chatIds = userChats?.map((item) => item.conversationId) || [];

      if (chatIds.length === 0) {
        setChats([]); // If user isn't in any chats, reset state
        setIsLoading(false);
        return;
      }

      // ✅ Step 2: Fetch chat group details
      const { data: chatsData, error: chatsError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", chatIds)
        .order("lastDate", { ascending: false });

      if (chatsError) {
        throw new Error(
          `Failed to fetch chat group details: ${chatsError.message}`,
        );
      }

      // ✅ Step 3: Fetch latest messages for each chat
      const chatsWithLatestMessages = await Promise.all(
        chatsData.map(async (chat) => {
          try {
            const { data: latestMessages, error: messagesError } =
              await supabase
                .from("messages")
                .select("content, createdAt, senderId")
                .eq("conversationId", chat.id)
                .order("createdAt", { ascending: false })
                .limit(1);

            if (messagesError) {
              console.warn(
                `Failed to fetch latest message for chat ${chat.id}:`,
                messagesError,
              );
              return {
                ...chat,
                lastMessage: "No messages yet",
                lastMessageTime: "",
              };
            }

            const latestMessage = latestMessages?.[0] || null;

            let formattedMessage = "No messages yet";
            let timestamp = "";

            if (latestMessage) {
              try {
                // ✅ Fetch sender's full name
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("fullName")
                  .eq("id", latestMessage.senderId)
                  .single();

                if (userError) {
                  console.warn(
                    `Failed to fetch sender name for message ${latestMessage.id}:`,
                    userError,
                  );
                }

                const senderName = userData?.fullName || "Unknown";
                formattedMessage = `${senderName}: ${latestMessage.content}`;
                timestamp = latestMessage.createdAt;
              } catch (userFetchError) {
                console.error(
                  "Unexpected error fetching sender name:",
                  userFetchError,
                );
              }
            }

            return {
              ...chat,
              lastMessage: formattedMessage,
              lastMessageTime: timestamp,
            };
          } catch (chatMessageError) {
            console.error(
              `Error processing chat ${chat.id}:`,
              chatMessageError,
            );
            return {
              ...chat,
              lastMessage: "Error loading messages",
              lastMessageTime: "",
            };
          }
        }),
      );

      setChats(chatsWithLatestMessages);
    } catch (error) {
      console.error("Error fetching chats:", error);
      alert("Failed to load chats. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !messageText.trim()) return;

    // Fetch the user's full name from the 'users' table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("fullName") // Assuming the column name is 'fullName'
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user full name:", userError);
      return;
    }

    const userName = userData.fullName || "Unknown User"; // Fallback in case the name is missing
    const newMessage = {
      conversationId: selectedChat.id,
      senderId: user.id,
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("messages").insert([newMessage]);

    if (!error) {
      setMessages((prev: any) => [
        ...prev,
        {
          _id: newMessage.conversationId,
          content: newMessage.content,
          user: { _id: user.id, name: userName },
          createdAt: new Date(),
        },
      ]);
      setMessageText("");

      await supabase
        .from("conversations")
        .update({ lastMessage: newMessage.content })
        .eq("id", newMessage.conversationId);
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
    setIsLoading(true);

    const newGroupId = nonCryptoUUID();
    const { error } = await supabase.from("conversations").insert([
      {
        id: newGroupId,
        chatName: newGroupName,
        lastDate: new Date().toISOString(),
        ownerId: user.id,
        participantIds: [user.id],
        lastMessage: "",
      },
    ]);

    const { error: memberError } = await supabase
      .from("conversationParticipants")
      .insert([
        {
          conversationId: newGroupId,
          userId: user.id,
          lastDate: new Date().toISOString(),
        },
      ]);

    if (!error) {
      setNewGroupName("");
      setModalVisible(false);
      setIsLoading(false);
      fetchChats();
      fetchUserGroups();
      handleSelectChat({ id: newGroupId, chatName: newGroupName });
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
      .from("conversationParticipants")
      .select("id")
      .eq("conversationId", selectedChat.id)
      .eq("userId", userData.id)
      .single();

    if (memberError && memberError.code !== "PGRST116") {
      return Alert.alert("Error", "Failed to check group membership");
    }

    if (existingMember) {
      return Alert.alert("Info", "User already in the group");
    }

    // Add user to group
    const { error } = await supabase.from("conversationParticipants").insert([
      {
        conversationId: selectedChat.id,
        userId: userData.id,
        lastDate: new Date().toISOString(),
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
      <View className="flex-row justify-between items-center px-6 py-16 bg-orange-500 shadow-lg border-b border-gray-200">
        {selectedChat && (
          <TouchableOpacity
            onPress={() => {
              setSelectedChat(null);
              setMessages([]);
              setMessageText("");
              setFabMenuOpen(false);
            }}
            className="p-2"
          >
            <FontAwesome name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-black">
          {selectedChat ? selectedChat.chatName : "Messages"}
        </Text>
        {selectedChat && (
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              if (isFabMenuOpen) {
                setFabMenuOpen(false);
              } else {
                setFabMenuOpen(true);
              }
            }}
          >
            <FontAwesome name="ellipsis-v" size={28} color="black" />
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
              className="bg-orange-100 rounded-xl p-6 mx-4 my-4 shadow-md border border-gray-200 hover:shadow-lg"
              onPress={() => handleSelectChat(item)}
            >
              <Text className="text-lg font-semibold text-gray-900">
                {item.chatName}
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
                  className={`p-4 rounded-lg my-2 max-w-[75%] shadow-sm ${
                    isMyMessage
                      ? "bg-orange-300 text-white self-end shadow-lg"
                      : "bg-gray-200 text-black self-start"
                  }`}
                >
                  <Text className="text-sm font-bold">{msg.user.name}</Text>
                  <Text className="text-base">{msg.content}</Text>
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
          className="absolute bottom-40 right-6 bg-orange-500 w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
          onPress={() => setModalVisible(true)}
        >
          {/* <FontAwesome name="plus" size={30} color="white" />
           */}
          <Text className="text-white font-bold text-center text-sm">
            Create Group
          </Text>
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
          <FontAwesome name="user-plus" size={24} color="black" />
          <Text className="text-base text-gray-800 px-3">Invite User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFabOption("members")}
          className="flex-row items-center space-x-3 p-2 rounded-lg bg-gray-50 active:bg-gray-100"
          activeOpacity={0.7}
        >
          <FontAwesome name="users" size={24} color="black" />
          <Text className="text-base text-gray-800 px-3">See Members</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFabOption("trips")}
          className="flex-row items-center px-3 p-2 rounded-lg bg-gray-50 active:bg-gray-100"
          activeOpacity={0.7}
        >
          <FontAwesome name="map" size={24} color="black" />
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
                      {member.fullName || member.email}
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
      {/* 📌 Loading Animation */}
      <LoadingOverlay
        visible={isLoading}
        type="dots"
        message="Loading Messages..."
      />
    </View>
  );
}
