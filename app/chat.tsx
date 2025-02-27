// import React, { useState, useCallback, useEffect } from "react";
// import { View, StyleSheet } from "react-native";
// import { GiftedChat, Bubble, InputToolbar, Send } from "react-native-gifted-chat";
// import { useAuth } from "../context/AuthProvider";
// import { FontAwesome } from "@expo/vector-icons";

// export default function ChatScreen() {
//   const { user } = useAuth(); // Get user info from AuthProvider
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     // Load initial messages (Dummy messages for now)
//     setMessages([
//       {
//         _id: 1,
//         text: "Hello! How can I help you today? 😊",
//         createdAt: new Date(),
//         user: {
//           _id: 2,
//           name: "Support",
//           avatar: "https://via.placeholder.com/100", // Default avatar
//         },
//       },
//     ]);
//   }, []);

//   // Handle sending messages
//   const onSend = useCallback((newMessages = []) => {
//     setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
//   }, []);

//   return (
//     <View style={styles.container}>
//       <GiftedChat
//         messages={messages}
//         onSend={(messages) => onSend(messages)}
//         user={{
//           _id: user?.id || 1, // Default to 1 if no user
//           name: user?.user_metadata?.full_name || "Guest",
//           avatar: user?.user_metadata?.avatar_url || "https://via.placeholder.com/100",
//         }}
//         renderBubble={(props) => (
//           <Bubble
//             {...props}
//             wrapperStyle={{
//               right: { backgroundColor: "#007bff" },
//               left: { backgroundColor: "#f0f0f0" },
//             }}
//             textStyle={{
//               right: { color: "#fff" },
//               left: { color: "#000" },
//             }}
//           />
//         )}
//         renderSend={(props) => (
//           <Send {...props}>
//             <View style={styles.sendButton}>
//               <FontAwesome name="send" size={20} color="white" />
//             </View>
//           </Send>
//         )}
//         renderInputToolbar={(props) => (
//           <InputToolbar
//             {...props}
//             containerStyle={styles.inputToolbar}
//             primaryStyle={{ alignItems: "center" }}
//           />
//         )}
//       />
//     </View>
//   );
// }

// // Styles
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F5F5F5" },
//   sendButton: {
//     marginRight: 10,
//     marginBottom: 5,
//     backgroundColor: "#007bff",
//     borderRadius: 20,
//     padding: 8,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   inputToolbar: {
//     borderTopWidth: 1,
//     borderTopColor: "#ddd",
//     backgroundColor: "#fff",
//     paddingVertical: 5,
//   },
// });

