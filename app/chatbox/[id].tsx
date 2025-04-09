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
  ScrollView,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthProvider";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  UserPlus,
  Users,
  Map,
  Plus,
} from "lucide-react-native";
import moment from "moment";
import { router, useLocalSearchParams } from "expo-router";
import LoadingOverlay from "@/components/loadingoverlay.js";

interface Chat {
  id: string;
  chatName: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface GroupMember {
  fullName: string;
}

interface Message {
  _id: string;
  content: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
  };
}

export default function ChatBox() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isMembersModalVisible, setMembersModalVisible] = useState(false);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (id) {
      fetchChatDetails();
      if (typeof id === "string") {
        fetchMessages(id);
        subscribeToMessages(id);
      }
    }
  }, [id]);

  const nonCryptoUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  const fetchChatDetails = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching chat details:", error);
      return;
    }

    setSelectedChat(data);
  };

  const fetchGroupMembers = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("conversationParticipants")
      .select("userId")
      .eq("conversationId", id)
      .order("lastDate", { ascending: true });

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, fullName")
      .in("id", data?.map((member) => member.userId) || []);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return;
    }

    if (!error) {
      setGroupMembers(
        data.map((member) => ({
          fullName:
            usersData.find((user) => user.id === member.userId)?.fullName ||
            "Unknown User",
        })),
      );
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
      default:
        break;
    }
    setFabMenuOpen(false);
  };

  const subscribeToMessages = (chatId: string) => {
    return supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversationId=eq.${chatId}`,
        },
        (payload) => {
          fetchMessages(chatId);
        },
      )
      .subscribe();
  };

  async function fetchMessages(chatId: string) {
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversationId", chatId)
      .order("createdAt", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return;
    }

    const userIds = [...new Set(messagesData.map((msg) => msg.senderId))];

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
        _id: msg.id || nonCryptoUUID(),
        content: msg.content,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.senderId,
          name: userMap[msg.senderId] || "Unknown User", // Fallback if name is missing
        },
      })),
    );
  }

  const handleSendMessage = async () => {
    if (!id || !messageText.trim()) return;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("fullName")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user full name:", userError);
      return;
    }

    const userName = userData.fullName || "Unknown User";
    const newMessage = {
      conversationId: id,
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

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !id)
      return Alert.alert("Error", "Enter a valid email");

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", inviteEmail)
      .single();

    if (userError || !userData) return Alert.alert("Error", "User not found");

    const { data: existingMember, error: memberError } = await supabase
      .from("conversationParticipants")
      .select("id")
      .eq("conversationId", id)
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
        conversationId: id,
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
    <View className="flex-1 bg-neutral-50">
      <View className="flex-row justify-between items-center px-ios-4 pt-14 pb-14 bg-blue-500 backdrop-blur-lg border-b border-neutral-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={28} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900">
          {selectedChat?.chatName}
        </Text>
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center rounded-ios-full"
          onPress={() => setFabMenuOpen(!isFabMenuOpen)}
        >
          <MoreVertical size={24} color="black" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <View className="flex-1">
          <ScrollView className="flex-1 px-ios-4 py-ios-2">
            {messages.map((msg) => {
              const isMyMessage = msg.user._id === user.id;
              return (
                <View
                  key={msg._id}
                  className={`p-ios-3 rounded-ios-lg my-2 max-w-[75%] ${
                    isMyMessage
                      ? "bg-primary self-end ml-auto"
                      : "bg-neutral-100 self-start"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isMyMessage ? "text-white/90" : "text-neutral-500"
                    }`}
                  >
                    {msg.user.name}
                  </Text>
                  <Text
                    className={`text-base ${isMyMessage ? "text-white" : "text-neutral-900"}`}
                  >
                    {msg.content}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      isMyMessage ? "text-white/70" : "text-neutral-500"
                    } self-end`}
                  >
                    {moment(msg.createdAt).format("hh:mm A")}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View className="flex-row items-center px-ios-4 py-ios-3 bg-white/80 backdrop-blur-lg border-t border-neutral-100 mb-[80px]">
            <TextInput
              className="flex-1 px-ios-4 py-ios-2 bg-neutral-100 rounded-ios text-base"
              placeholder={`Message #${selectedChat?.chatName}`}
              placeholderTextColor="#8E8E93"
              value={messageText}
              onChangeText={setMessageText}
              multiline={true}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              className="ml-ios-2 w-10 h-10 bg-primary rounded-ios-full items-center justify-center"
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Animated.View
        className="absolute top-28 right-6 bg-white shadow-ios rounded-ios-lg"
        style={{
          transform: [{ scale: popupScale }],
          opacity: popupScale,
        }}
      >
        <TouchableOpacity
          onPress={() => handleFabOption("invite")}
          className="flex-row items-center p-ios-3 active:bg-neutral-100"
        >
          <UserPlus size={20} color="#007AFF" />
          <Text className="ml-3 text-base text-neutral-900">Invite User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFabOption("members")}
          className="flex-row items-center p-ios-3 active:bg-neutral-100"
        >
          <Users size={20} color="#007AFF" />
          <Text className="ml-3 text-base text-neutral-900">See Members</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={isMembersModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-ios-lg">
            <View className="w-8 h-1 bg-neutral-300 rounded-full mx-auto my-3" />
            <View className="p-ios-4">
              <Text className="text-2xl font-bold text-neutral-900 mb-4">
                Group Members
              </Text>
              <ScrollView className="max-h-[400px]">
                {groupMembers.map((member: any, index: any) => (
                  <View
                    key={index}
                    className="py-ios-3 border-b border-neutral-100"
                  >
                    <Text className="text-base text-neutral-900">
                      {member.fullName || member.email}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                className="mt-6 bg-neutral-100 py-ios-3 rounded-ios-full"
                onPress={() => setMembersModalVisible(false)}
              >
                <Text className="text-primary font-semibold text-center text-base">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isInviteModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-ios-lg">
            <View className="w-8 h-1 bg-neutral-300 rounded-full mx-auto my-3" />
            <View className="p-ios-4">
              <Text className="text-2xl font-bold text-neutral-900 mb-4">
                Invite User
              </Text>
              <TextInput
                className="w-full p-ios-3 bg-neutral-100 rounded-ios text-base"
                placeholder="Email address"
                placeholderTextColor="#8E8E93"
                value={inviteEmail}
                onChangeText={setInviteEmail}
              />
              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  className="flex-1 bg-neutral-100 py-ios-3 rounded-ios-full"
                  onPress={() => setInviteModalVisible(false)}
                >
                  <Text className="text-primary font-semibold text-center text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary py-ios-3 rounded-ios-full"
                  onPress={handleInviteUser}
                >
                  <Text className="text-white font-semibold text-center text-base">
                    Invite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay
        visible={isLoading}
        type="dots"
        message="Loading Messages..."
      />
    </View>
  );
}
