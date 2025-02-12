import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NavigationDrawer({ onClose }) {
  const router = useRouter();

  return (
    <View style={styles.drawer}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <FontAwesome name="arrow-left" size={22} color="black" />
      </TouchableOpacity>
      <Text style={styles.username}>Kevin Le</Text>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
        <FontAwesome name="user" size={22} color="black" />
        <Text style={styles.navText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
        <FontAwesome name="cog" size={22} color="black" />
        <Text style={styles.navText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: { width: 250, backgroundColor: '#FFA500', padding: 20, position: 'absolute', left: 0, top: 0, height: '100%' },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  navText: { fontSize: 16, marginLeft: 10 },
  closeButton: { position: 'absolute', top: 20, right: 20 },
});
