import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import axios from "axios";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import LoadingOverlay from "../loadingoverlay";
const { width, height } = Dimensions.get("window"); // Get screen dimensions

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

const randomUUID = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export default function PlaceScreen() {
  const { id } = useLocalSearchParams(); // Get place ID from URL params
  const [place, setPlace] = useState<{
    title: string;
    description: string;
    images: string[];
    types: [];
    reviews: [];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        if (!id) return;

        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/details/json`,
          {
            params: {
              place_id: id,
              key: GOOGLE_MAPS_API_KEY,
              fields: "name,formatted_address,photos,type,reviews",
            },
          },
        );

        const data = response.data.result;
        const imageUrls = data.photos
          ? data.photos
              .slice(0, 5)
              .map(
                (photo: any) =>
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`,
              )
          : ["https://via.placeholder.com/400"];
        setPlace({
          title: data.name,
          description: data.formatted_address || "No description available.",
          images: imageUrls,
          types: data.types,
          reviews: data.reviews,
        });
      } catch (error) {
        console.error("Error fetching place details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [id]);

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

      setChats(chatsData || []);

      if (chatsError) {
        throw new Error(
          `Failed to fetch chat group details: ${chatsError.message}`,
        );
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }

  // Handle creating a trip at this location
  const handleCreateTrip = async () => {
    console.log("place is", place);
    setNewTripName(place.title);
    console.log("Creating trip at:", newTripName);
    if (!newTripName.trim()) {
      return Alert.alert("Error", "Trip name required.");
    }

    const newTripId = randomUUID();
    const { data: chatData, error: chatError } = await supabase
      .from("conversationParticipants")
      .select("conversationId")
      .eq("userId", user.id);

    if (chatError || !chatData || chatData.length === 0) {
      return Alert.alert("Error", "No chats found.");
    }

    const chatIds = chatData.map((item) => item.conversationId);
    if (!selectedChat) {
      return Alert.alert("Error", "Please select a chat.");
    }

    // Insert new trip
    const { error } = await supabase.from("trips").insert([
      {
        id: newTripId,
        conversationId: selectedChat.id,
        creatorId: user.id,
        name: newTripName,
        createdAt: new Date().toISOString(),
        location: place.title,
        latitude: 37.7749, // For simplicity, hardcoded; change as needed
        longitude: -122.4194, // Hardcoded for San Francisco
      },
    ]);

    // Fetch members of the selected chat
    const { data: members, error: membersError } = await supabase
      .from("conversationParticipants")
      .select("userId")
      .eq("conversationId", selectedChat.id);

    if (membersError || !members || members.length === 0) {
      return Alert.alert("Error", "No users found in this chat.");
    }

    const participantsData = members.map((member) => ({
      id: randomUUID(),
      tripId: newTripId,
      userId: member.userId,
      latitude: 0.0,
      longitude: 0.0,
      joinedAt: new Date().toISOString(),
    }));

    const { error: participantsError } = await supabase
      .from("tripParticipants")
      .insert(participantsData);

    if (error || participantsError) {
      return Alert.alert("Error", "Failed to create trip.");
    }

    setNewTripName("");
    setIsModalVisible(false);
    Alert.alert("Success", "Trip created successfully!");
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-12 bg-orange-400 shadow-md">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <FontAwesome name="arrow-left" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="blue"
          className="flex-1 justify-center items-center"
        />
      ) : place ? (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="w-full h-[55vh]">
            <Carousel
              loop
              pagingEnabled
              snapEnabled
              width={Dimensions.get("window").width} // Full width dynamically
              height={Dimensions.get("window").height * 0.55} // 55% of screen height
              data={place.images}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  className="w-full h-full shadow-lg"
                  resizeMode="cover" // Ensures image fills the entire space
                />
              )}
            />
          </View>

          <View className="px-5 py-4">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              {place.title}
            </Text>
            <Text className="text-lg text-gray-600">{place.description}</Text>
            <Text className="text-sm text-gray-500 mt-2">
              {place.types?.join(", ") || "Types"}
            </Text>
          </View>

          <TouchableOpacity
            className="bg-blue-600 py-3 mx-5 rounded-xl shadow-lg flex items-center justify-center mt-4"
            onPress={() => router.push(`/map/${id}`)}
          >
            <Text className="text-white font-semibold text-lg">
              View on Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-orange-500 py-3 mx-5 rounded-xl shadow-lg flex items-center justify-center mt-6"
            onPress={() => {
              fetchChats();
              setIsModalVisible(true);
            }}
          >
            <Text className="text-white font-semibold text-lg">
              Create Trip at this location
            </Text>
          </TouchableOpacity>

          <View className="bg-gray-100 rounded-xl px-5 py-4 mx-5 mt-6 shadow-md">
            <Text className="text-xl font-bold text-gray-800 mb-3">
              Reviews
            </Text>
            {place.reviews && place.reviews.length > 0 ? (
              <ScrollView
                className="max-h-[250px]"
                showsVerticalScrollIndicator={false}
              >
                {place.reviews.map((review, index) => (
                  <View
                    key={index}
                    className="bg-white p-3 rounded-lg mb-3 shadow-sm"
                  >
                    <Text className="text-sm font-bold text-gray-700">
                      {review.author_name}
                    </Text>
                    <Text className="text-xs text-yellow-600">
                      ⭐ {review.rating}/5
                    </Text>
                    <Text className="text-sm text-gray-600 mt-2">
                      {review.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-center text-gray-500 text-sm">
                No reviews yet
              </Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <Text className="text-lg text-red-500 text-center mt-10">
          Place not found
        </Text>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 backdrop-blur-md">
          <View className="bg-white w-[85%] rounded-2xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Select a Chat for the Trip
            </Text>

            {/* List of Chats */}
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                className="bg-gray-100 p-3 rounded-lg mb-2 shadow-sm"
                onPress={() => {
                  setSelectedChat(chat);
                  handleCreateTrip();
                  setIsModalVisible(false);
                }}
              >
                <Text className="text-lg font-semibold text-gray-800">
                  {chat.chatName}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-5 bg-gray-300 py-3 w-full rounded-xl"
              onPress={() => {
                setIsModalVisible(false);
                console.log(isModalVisible);
              }}
            >
              <Text className="text-gray-800 font-bold text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
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
