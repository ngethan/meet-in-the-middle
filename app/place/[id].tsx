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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import axios from "axios";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

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

  return (
    <View className="flex-1 bg-white">
      {loading ? (
        <ActivityIndicator
          size="large"
          color="blue"
          className="flex-1 justify-center items-center"
        />
      ) : place ? (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* 📌 Image Carousel */}
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
                  className="w-full h-full rounded-xl shadow-lg"
                  resizeMode="cover" // Ensures image fills the entire space
                />
              )}
            />
          </View>

          {/* 📌 Place Details */}
          <View className="px-5 py-4">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              {place.title}
            </Text>
            <Text className="text-lg text-gray-600">{place.description}</Text>
            <Text className="text-sm text-gray-500 mt-2">
              {place.types?.join(", ") || "Types"}
            </Text>
          </View>

          {/* 📌 View on Map Button */}
          <TouchableOpacity
            className="bg-blue-600 py-3 mx-5 rounded-xl shadow-lg flex items-center justify-center mt-4"
            onPress={() => router.push(`/map/${id}`)}
          >
            <Text className="text-white font-semibold text-lg">
              View on Map
            </Text>
          </TouchableOpacity>

          {/* 📌 Reviews Section */}
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
    </View>
  );
}
