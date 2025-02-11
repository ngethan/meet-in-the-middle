import React, {useState} from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NavigationDrawer from '../components/Drawer';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

const trips = [
  { id: '1', title: 'Tokyo, Japan', image: require('../assets/images/tokyo.jpg') },
  { id: '2', title: 'Kyoto, Japan', image: require('../assets/images/kyoto.jpg') },
  { id: '3', title: 'Japanese Dessert', image: require('../assets/images/dessert.jpg') },
];

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {drawerOpen && <NavigationDrawer onClose={() => setDrawerOpen(false)} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <FontAwesome name="bars" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}> Japan</Text>
        <TouchableOpacity>
          <FontAwesome name="user-circle" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.tripContainer} 
            activeOpacity={0.8} 
            onPress={() => router.push(`/place/${item.id}`)} // Navigate to Place Details
          >
            <Image source={item.image} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.tripTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button - Rounded */}
      <TouchableOpacity style={styles.fab}>
        <FontAwesome name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: height * 0.08,
    backgroundColor: '#FFF',
    elevation: 5, // Shadow effect for Android
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3D47',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tripContainer: {
    marginBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 4, // Android shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  image: {
    width: '100%',
    height: height * 0.25, // Increased height for better fit
    resizeMode: 'cover',
    borderRadius: 18,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  tripTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
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
});
