import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const tripDetails: Record<string, { title: string; description: string; image: any }> = {
    '1': {
    title: 'Tokyo, Japan',
    description: 'Tokyo is a bustling metropolis with incredible culture, food, and history.',
    image: require('../../assets/images/tokyo.jpg'),
  },
  '2': {
    title: 'Kyoto, Japan',
    description: 'Kyoto is known for its classical Buddhist temples, gardens, and geisha culture.',
    image: require('../../assets/images/kyoto.jpg'),
  },
  '3': {
    title: 'Japanese Dessert',
    description: 'Enjoy the finest matcha-flavored desserts and traditional sweets.',
    image: require('../../assets/images/dessert.jpg'),
  },
};

export default function PlaceScreen() {
  const { id } = useLocalSearchParams(); // Get ID from URL params
  console.log('🔍 Debugging ID:', id, 'Type:', typeof id); // Debug log

  // Ensure id is always a string
  const idString = Array.isArray(id) ? id[0] : id;
  console.log('✅ Converted ID:', idString, 'Type:', typeof idString);
  const place = tripDetails[String(id)] || { title: 'Unknown Place', description: 'No details available.', image: require('../../assets/images/default.jpg') };

  return (
    <View style={styles.container}>
      <Image source={place.image} style={styles.image} />
      <Text style={styles.title}>{place.title}</Text>
      <Text style={styles.description}>{place.description}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
  
    // Image now fills the top half of the screen
    image: {
      width: '100%',
      height: height * 0.6, 
      resizeMode: 'cover',
    },
  
    detailsContainer: {
      flex: 1,
      padding: 20,
    },
  
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333',
    },
  
    description: {
      fontSize: 18,
      color: '#555',
    },
  });