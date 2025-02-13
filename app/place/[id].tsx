import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator, ScrollView, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import axios from 'axios';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const GOOGLE_MAPS_API_KEY = 'AIzaSyDkcz7TkarfHsrxmyT3DgGogjodxy_IChY';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams(); // Get place ID from URL params
  const [place, setPlace] = useState<{ title: string; description: string; images: string[], types: [], reviews: []} | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        if (!id) return;

        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
          params: {
            place_id: id,
            key: GOOGLE_MAPS_API_KEY,
            fields: 'name,formatted_address,photos,type,reviews',
          },
        });

        const data = response.data.result;
        const imageUrls = data.photos
          ? data.photos.slice(0, 5).map((photo:any) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
            )
          : ['https://via.placeholder.com/400'];
        setPlace({
          title: data.name,
          description: data.formatted_address || 'No description available.',
          images: imageUrls,
          types: data.types,
          reviews: data.reviews,
        });
      } catch (error) {
        console.error('Error fetching place details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [id]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="blue" style={styles.loader} />
      ) : place ? (
        <>
          <Carousel
            style={styles.image}
            data={place.images}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} />
            )}
            height={220}
            loop={true}
            pagingEnabled={true}
            snapEnabled={true}
            width={width}
          />

          {/* Place Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{place.title}</Text>
            <Text style={styles.description}>{place.description}</Text>
            <Text style={styles.types}>{place.types?.join(', ') || "Types"}</Text>
          </View>
          {/* Button to map with location */}
          <Button title="View on Map" onPress={() => router.push(`/map/${id}`)} />

          {/* Scrollable Reviews Section */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.reviewsTitle}>Reviews</Text>
            {place.reviews && place.reviews.length > 0 ? (
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {place.reviews.map((review, index) => (
                  <View key={index} style={styles.review}>
                    <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                    <Text style={styles.reviewRating}>⭐ {review.rating}/5</Text>
                    <Text style={styles.reviewText}>{review.text}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>Place not found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: height * 0.55, 
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 18,
    color: '#555',
  },
  errorText: {
    fontSize: 20,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  reviewsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250, // Limits the height to make it scrollable
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  scrollView: {
    maxHeight: 260, // Limits scroll height
  },
  review: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  reviewRating: {
    fontSize: 12,
    color: "#ff9800",
    marginVertical: 2,
  },
  reviewText: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  noReviewsText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    marginTop: 10,
  },
  types: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
});

