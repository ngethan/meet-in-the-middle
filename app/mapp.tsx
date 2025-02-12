import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import MapView from 'react-native-maps';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

export default function Map() {
    return (
        <View style={styles.container}>
          <MapView style={styles.map} />
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
  });