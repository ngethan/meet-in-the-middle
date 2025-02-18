import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  ScrollView
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthProvider";
import { FontAwesome } from "@expo/vector-icons";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

const { width, height } = Dimensions.get("window");

export default function ChatScreen() {
  const { user } = useAuth(); // Get logged-in user
  const [chats, setChats] = useState([]); // Group chats
  const [messages, setMessages] = useState([]); // Messages in selected chat
  const [selectedChat, setSelectedChat] = useState(null); // Active chat
  const [newGroupName, setNewGroupName] = useState(""); // New group name
  const [inviteEmail, setInviteEmail] = useState(""); // Invite user email
  const [isModalVisible, setModalVisible] = useState(false); // Group modal
  const [messageText, setMessageText] = useState("");
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isMembersModalVisible, setMembersModalVisible] = useState(false);

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

  /** 📌 Subscribe to real-time chat updates */
  function subscribeToChats() {
    return supabase
      .channel("chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, fetchUserGroups)
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
      }))
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
        })
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
    console.log("User full name:", userName);
    const newMessage = {
      chat_id: selectedChat.id,
      user_id: user.id,
      text: messageText.trim(),
      created_at: new Date().toISOString(),
    };
  
    console.log("Sending message", newMessage);
  
    const { error } = await supabase.from("messages").insert([newMessage]);
  
    if (!error) {
      setMessages((prev: any) => [
        ...prev,
        { _id: newMessage.chat_id, text: newMessage.text, user: { _id: user.id, name: userName }, createdAt: new Date() },
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
    if (!newGroupName.trim()) return Alert.alert("Error", "Group name cannot be empty");

    const newGroupId = uuidv4();
    const { error } = await supabase
      .from("chats")
      .insert([{ id: newGroupId, name: newGroupName, created_at: new Date().toISOString() }]);

    const { error: memberError } = await supabase
    .from("group_members")
    .insert([{ chat_id: newGroupId, user_id: user.id, joined_at: new Date().toISOString() }]);

    if (!error) {
      setNewGroupName("");
      setModalVisible(false);
      fetchUserGroups();
      handleSelectChat({ id: newGroupId, name: newGroupName });
    }
  };

  /** 📌 Invite user to group */
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedChat) return Alert.alert("Error", "Enter a valid email");

    // Get invited user's ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", inviteEmail)
      .single();

    if (userError || !userData) return Alert.alert("Error", "User not found");

    // Add user to group
    const { error } = await supabase.from("group_members").insert([
      { chat_id: selectedChat.id, user_id: userData.id, joined_at: new Date().toISOString() },
    ]);

    if (!error) {
      setInviteEmail("");
      setInviteModalVisible(false);
      Alert.alert("Success", "User invited to the group!");
    }
  };

  return (
    <View style={styles.container}>
      {/* 📌 Header */}
      <View style={styles.header}>
        {selectedChat && (
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{selectedChat ? selectedChat.name : "Messages"}</Text>
        {selectedChat && (
          <TouchableOpacity onPress={() => setInviteModalVisible(true)} style={styles.inviteButton}>
            <FontAwesome name="user-plus" size={24} color="black" />
          </TouchableOpacity>
        )}
          {/* Check Group Members Button (Only in Group Chat) */}
        {selectedChat && (
          <TouchableOpacity onPress={() => fetchGroupMembers()} style={styles.groupMembersButton}>
            <FontAwesome name="users" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📌 Chat List */}
      {!selectedChat ? (
        <FlatList
        data={chats}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => handleSelectChat(item)}>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage || "No messages yet..."}</Text>
            </View>
            <View style={styles.timestampContainer}>
              <Text style={styles.timestamp}>
                {item.last_message_time ? moment.utc(item.last_message_time).local().fromNow() : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />      
      ) : (
        
        <View style={styles.chatContainer}>
          <>
          {/* 📌 Chat Messages */}
          <ScrollView style={styles.messagesContainer}>
            {messages.map((msg:any) => {
              const isMyMessage = msg.user._id === user.id;
              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessage : styles.otherMessage,
                  ]}
                >
                  {/* User Name */}
                  <Text style={styles.messageSender}>{msg.user.name || "Unknown User"}</Text>

                  {/* Message Text */}
                  <Text style={styles.messageText}>{msg.text}</Text>

                  {/* Timestamp */}
                  <Text style={styles.messageTimestamp}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

        </>
          {/* 📌 Send Message Input Box */}
          <View style={styles.sendMessageContainer}>
            <TextInput
              style={styles.sendMessageInput}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <FontAwesome name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

    {/* 📌 Create Group Button (Only when viewing group list) */}
    {!selectedChat && (
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={30} color="white" />
      </TouchableOpacity>
    )}

      {/* 📌 Create Group Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                <Text style={styles.createText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📌 Invite User Modal */}
      <Modal visible={isInviteModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite User</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter user email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.createButton} onPress={handleInviteUser}>
                <Text style={styles.createText}>Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setInviteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📌 Group Members Modal */}
      <Modal visible={isMembersModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Group Members</Text>
            
            {groupMembers.length > 0 ? (
              <FlatList
                data={groupMembers}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }: { item: any }) => (
                  <View style={styles.memberItem}>
                    <Text style={styles.memberText}>{item.full_name || item.email}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noMembersText}>No members found</Text>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => setMembersModalVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  );
}


const styles = StyleSheet.create({
  /** 🌟 Main Chat Container */
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  /** 🌟 Header */
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: "20%", 
    backgroundColor: "#fff", 
    elevation: 3, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#333" },

  /** 🌟 Chat List */
  chatName: { fontSize: 24, fontWeight: "bold", color: "#333"},

  /** 🌟 Chat Messages */
  chatContainer: { flex: 1, justifyContent: "space-between"},
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },

  /** 🟡 Message Bubble */
  messageContainer: {
    maxWidth: "55%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },

  /** 🟡 My Messages */
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FFBB33",
    borderTopRightRadius: 5, // Sharp corner for my messages
  },

  /** 🔵 Other User's Messages */
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 5, // Sharp corner for received messages
  },

  /** 🟡 Message Text */
  messageText: {
    fontSize: 16,
    color: "#333",
  },

  /** 🔵 Sender Name (Only for received messages) */
  messageSender: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
  },

  /** ⏳ Timestamp */
  messageTimestamp: {
    fontSize: 12,
    color: "#777",
    alignSelf: "flex-end",
    marginTop: 4,
  },

  /** 🌟 Floating Action Button (FAB) */
  fab: {
    position: 'absolute',
    bottom: "14%",
    right: 20,
    backgroundColor: '#ff8800',
    width: 70, // Ensure button is a perfect circle
    height: 70,
    borderRadius: 35, // Makes it round
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // Shadow for Android
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  sendMessageInput: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#f5f5f5" },
  sendButton: { padding: 12, backgroundColor: "#ff8800", borderRadius: 10, marginLeft: 8 },
  sendMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: "26%",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  
  /** 🌟 Modal for Group Creation */
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)", 
  },
  
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 15, 
    color: "#333" 
  },
  modalInput: {
    width: "100%",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
  },

  /** 🌟 Buttons side by side */
  modalButtonContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%", 
    marginTop: 10
  },
  createButton: { 
    backgroundColor: "#ff8800", 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: "center", 
    marginRight: 10,
    width: "48%",
  },
  createText: { 
    fontWeight: "bold", 
    color: "#FFF", 
    fontSize: 16 
  },
  cancelButton: { 
    backgroundColor: "#ccc", 
    paddingVertical: 12, 
    borderRadius: 10, 
    width: "48%",
    alignItems: "center",
  },
  cancelText: { 
    fontWeight: "bold", 
    color: "#333", 
    fontSize: 16 
  },

  input: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 10,
    color: "#333",
  },

  /** 📌 Invite Container */
  inviteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },

  /** 📌 Invite Button */
  inviteButton: {
    backgroundColor: "#ffbb33",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  /** 📌 Invite Button Text */
  inviteText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  
  backButton: {
    marginRight: 10,
    marginLeft: 10,
  },

  groupMembersButton: {
    padding: 10,
    marginLeft: 10,
  },
  
  /** 🟡 Member List Item */
  memberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  
  /** 🟢 Member Name */
  memberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  
  /** 🔴 No Members Found */
  noMembersText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#FFD700", 
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
    height: 100,
  },

  chatInfo: {
    flex: 1, // Takes up available space
  },

  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  timestampContainer: {
    alignItems: "flex-end",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
});
