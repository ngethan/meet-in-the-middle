import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { Marker } from 'react-native-maps';
import axios from 'axios';
import {router } from 'expo-router';

const { width, height } = Dimensions.get('window'); // Get screen dimensions
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export default function Map() {
    const { id } = useLocalSearchParams(); // Get place ID from URL params
    const [location, setLocation] = useState(null);
    const [initialRegion, setInitialRegion] = useState(null);

    useEffect(() => {
      const fetchPlaceDetails = async () => {
        try {
          const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
            params: {
              place_id: id,
              key: GOOGLE_MAPS_API_KEY,
              fields: 'geometry',
            },
          });
  
          const data = response.data.result;
          const loc = data.geometry.location;
          setLocation(data.geometry.location);
          setInitialRegion({
            latitude: loc.lat,
            longitude: loc.lng,
            latitudeDelta: 0.08, // Smaller delta values for closer zoom
            longitudeDelta: 0.08,
          });
        } catch (error) {
          console.error('Error fetching place details:', error);
        }
      };
  
      fetchPlaceDetails();
    }, [id]);
    return (
        <View style={styles.container}>
        <MapView style={styles.map} initialRegion={initialRegion}>
          {location && (
            <Marker
              coordinate={{ latitude: location.lat, longitude: location.lng }}
              title="Place Location"
            />
          )}
        </MapView>
        <View style={styles.buttonContainer}>
        <Button title="Back" onPress={() => router.back()} />
      </View>
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
    map: {
        width: '100%',
        height: '100%',
      },
      buttonContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
      },
  });