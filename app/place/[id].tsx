import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  PanResponder,
  NativeScrollEvent,
  NativeSyntheticEvent,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import axios from "axios";
import { ArrowUp, ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import LoadingOverlay from "../../components/loadingoverlay";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MapPin, MessageSquare } from "lucide-react-native";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const randomUUID = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export default function PlaceScreen() {
  const { id } = useLocalSearchParams();
  const [place, setPlace] = useState<{
    id: string;
    title: string;
    description: string;
    images: string[];
    types: [];
    reviews: {
      author_name: string;
      rating: number;
      text: string;
    }[];
    latitude: string;
    longitude: string;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Animation setup
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const scrollOffset = useRef(0);

  const translateY = panY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [0, SCREEN_HEIGHT],
    extrapolate: "clamp",
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const diff = currentOffset - scrollOffset.current;

    if (diff < 0) {
      // Scrolling up
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }

    scrollOffset.current = currentOffset;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newPosition = Math.max(0, gestureState.dy);
      panY.setValue(newPosition);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        // User dragged down
        Animated.spring(panY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
        }).start();
      } else {
        // User dragged up
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Button animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

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
              fields: "name,formatted_address,photos,type,review,geometry",
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
          id: Array.isArray(id) ? id[0] : id,
          title: data.name,
          description: data.formatted_address || "No description available.",
          images: imageUrls,
          types: data.types,
          reviews: data.reviews,
          latitude: data.geometry.location.lat,
          longitude: data.geometry.location.lng,
          address: data.formatted_address,
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
      const { data: userChats, error: userChatsError } = await supabase
        .from("conversationParticipants")
        .select("conversationId")
        .eq("userId", user.id);

      if (userChatsError) {
        throw new Error(
          `Failed to fetch user chat groups: ${userChatsError.message}`,
        );
      }

      const chatIds = userChats?.map((item) => item.conversationId) || [];

      if (chatIds.length === 0) {
        setChats([]);
        setIsLoading(false);
        setIsModalVisible(true);
        return;
      }

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

      // Process chat data to include participant names
      const processedChats = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: participants, error: participantsError } =
            await supabase
              .from("conversationParticipants")
              .select("userId")
              .eq("conversationId", chat.id);

          if (participantsError) {
            throw new Error(
              `Error fetching participants: ${participantsError.message}`,
            );
          }

          const participantsNames = await Promise.all(
            participants.map(async (participant) => {
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("fullName")
                .eq("id", participant.userId)
                .single();

              if (userError) {
                throw new Error(
                  `Error fetching user data: ${userError.message}`,
                );
              }

              return userData.fullName;
            }),
          );

          return { ...chat, participants: participantsNames };
        }),
      );

      setChats(processedChats);
      setIsLoading(false);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to load chats. Please try again.");
    }
  }

  const handleDateChange = (
    event: any,
    selectedDate: Date | undefined,
    isStart: boolean,
  ) => {
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

  // Handle creating a trip at this location
  const handleCreateTrip = async () => {
    setIsLoading(true);
    if (!place) {
      return Alert.alert("Error", "Place information not available.");
    }

    if (!place.title.trim()) {
      return Alert.alert("Error", "Trip name required.");
    }

    const newTripId = randomUUID();

    // // Insert new trip
    const { error } = await supabase.from("trips").insert([
      {
        id: newTripId,
        conversationId: selectedChat?.id,
        creatorId: user.id,
        name: newTripName,
        createdAt: new Date().toISOString(),
        bestLocation: place?.title,
        bestLatitude: place?.latitude,
        bestPlaceId: place?.id,
        bestLongitude: place?.longitude,
        bestAddress: place?.address,
        bestPhotos: place?.images,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    ]);

    // Fetch members of the selected chat
    const { data: members, error: membersError } = await supabase
      .from("conversationParticipants")
      .select("userId")
      .eq("conversationId", selectedChat?.id);

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
    setIsLoading(false);
    Alert.alert("Success", "Trip created successfully!");
  };

  return (
    <View className="flex-1 bg-black">
      {loading ? (
        <ActivityIndicator size="large" color="white" className="flex-1" />
      ) : place ? (
        <>
          <View className="flex-1">
            <Carousel
              loop
              width={Dimensions.get("window").width}
              height={Dimensions.get("window").height}
              data={place.images}
              renderItem={({ item }) => (
                <View className="flex-1">
                  <Image
                    source={{ uri: item }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-32 left-6 right-6">
                    <Text
                      className="text-white text-5xl font-bold"
                      numberOfLines={2}
                    >
                      {place.title}
                    </Text>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute top-16 left-6 p-2 bg-gray-100 rounded-full shadow-sm active:bg-gray-200"
            >
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>

            <Animated.View
              className="absolute bottom-20 right-6"
              style={{
                transform: [{ scale: buttonScale }],
              }}
            >
              <TouchableOpacity
                className="bg-white rounded-full p-4 shadow-lg"
                onPress={() => {
                  Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <ArrowUp size={20} color="black" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <Animated.View
            style={{
              transform: [{ translateY }],
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: SCREEN_HEIGHT * 0.6,
              backgroundColor: "white",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
            }}
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2" />

            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
              bounces={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View className="pb-6">
                <Text className="text-xl text-gray-800 font-medium leading-relaxed mb-3 mt-2">
                  {place.description}
                </Text>

                <View className="flex-row flex-wrap mt-1 mb-5">
                  {place.types?.map((type, index) => (
                    <View
                      key={index}
                      className="bg-blue-50 px-3 py-1.5 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-blue-600 text-xs font-medium">
                        {type}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row space-x-3 mb-8">
                  <TouchableOpacity
                    className="flex-1 bg-indigo-600 py-4 rounded-2xl shadow-md flex-row items-center justify-center mr-3"
                    style={{ elevation: 3 }}
                    onPress={() => router.push(`/map/${id}`)}
                    activeOpacity={0.8}
                  >
                    <MapPin size={18} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      View on Map
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-blue-500 py-4 rounded-2xl shadow-md flex-row items-center justify-center ml-3"
                    style={{ elevation: 3 }}
                    onPress={() => fetchChats()}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={18} color="white" />
                    <Text className="text-white font-bold text-base ml-2">
                      Create Trip
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-gray-800">
                    Reviews
                  </Text>
                  <View className="flex-row items-center bg-yellow-100 px-3 py-1 rounded-full">
                    <Text className="text-yellow-700 font-bold mr-1">
                      {place.reviews?.length > 0
                        ? (
                            place.reviews.reduce(
                              (acc, review) => acc + review.rating,
                              0,
                            ) / place.reviews.length
                          ).toFixed(1)
                        : "N/A"}
                    </Text>
                    <Text className="text-yellow-600">★</Text>
                  </View>
                </View>

                {place.reviews && place.reviews.length > 0 ? (
                  <View className="space-y-3">
                    {place.reviews.map((review, index) => (
                      <View
                        key={index}
                        className="bg-white p-4 rounded-xl shadow-sm"
                        style={{ elevation: 1 }}
                      >
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-base font-bold text-gray-800">
                            {review.author_name}
                          </Text>
                          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
                            <Text className="text-yellow-600 font-bold">
                              {review.rating}
                            </Text>
                            <Text className="text-yellow-500 ml-1">★</Text>
                          </View>
                        </View>
                        <Text className="text-gray-700 leading-relaxed">
                          {review.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="bg-white p-6 rounded-xl items-center">
                    <Text className="text-gray-500 text-center">
                      No reviews available for this location yet
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>

          {/* Modal for selecting chat and creating trip */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white w-[90%] rounded-xl p-5 max-h-[80%]">
                <Text className="text-xl font-bold text-center mb-4">
                  Create Trip at {place?.title}
                </Text>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#0000ff" />
                ) : chats.length > 0 ? (
                  <>
                    <Text className="text-gray-700 mb-2">Select a chat:</Text>
                    <FlatList
                      data={chats}
                      keyExtractor={(item) => item.id}
                      className="max-h-[200px] mb-4"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          className={`p-3 mb-2 rounded-lg border ${
                            selectedChat?.id === item.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                          onPress={() => setSelectedChat(item)}
                        >
                          <Text className="font-semibold text-lg text-black">
                            {item.chatName}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {item.participants?.join(", ")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />

                    {selectedChat && (
                      <>
                        <Text className="text-gray-700 mb-2">Trip Name:</Text>
                        <TextInput
                          className="border border-gray-300 p-2 rounded-lg mb-4"
                          value={newTripName}
                          onChangeText={setNewTripName}
                          placeholder="Enter trip name"
                        />

                        <View className="flex-row justify-between mb-4">
                          <View className="flex-1 mr-2">
                            <Text className="text-gray-700 mb-2">
                              Start Date:
                            </Text>
                            <TouchableOpacity
                              className="border border-gray-300 p-2 rounded-lg"
                              onPress={() => setShowStartPicker(true)}
                            >
                              <Text>
                                {moment(startDate).format("MMM DD, YYYY")}
                              </Text>
                            </TouchableOpacity>
                            {showStartPicker && (
                              <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) =>
                                  handleDateChange(e, date, true)
                                }
                              />
                            )}
                          </View>

                          <View className="flex-1 ml-2">
                            <Text className="text-gray-700 mb-2">
                              End Date:
                            </Text>
                            <TouchableOpacity
                              className="border border-gray-300 p-2 rounded-lg"
                              onPress={() => setShowEndPicker(true)}
                            >
                              <Text>
                                {moment(endDate).format("MMM DD, YYYY")}
                              </Text>
                            </TouchableOpacity>
                            {showEndPicker && (
                              <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) =>
                                  handleDateChange(e, date, false)
                                }
                              />
                            )}
                          </View>
                        </View>
                      </>
                    )}

                    <View className="flex-row justify-end mt-4">
                      <TouchableOpacity
                        className="bg-gray-300 py-2 px-4 rounded-lg mr-2"
                        onPress={() => setIsModalVisible(false)}
                      >
                        <Text>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`py-2 px-4 rounded-lg ${
                          selectedChat && newTripName.trim()
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                        onPress={handleCreateTrip}
                        disabled={!selectedChat || !newTripName.trim()}
                      >
                        <Text className="text-white">Create Trip</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View className="items-center py-4">
                    <Text className="text-gray-700 text-center mb-4">
                      You don't have any chats yet. Create a chat first to plan
                      a trip.
                    </Text>
                    <TouchableOpacity
                      className="bg-gray-300 py-2 px-4 rounded-lg"
                      onPress={() => setIsModalVisible(false)}
                    >
                      <Text>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text className="text-lg text-red-500 text-center mt-10">
          Place not found
        </Text>
      )}
    </View>
  );
}
