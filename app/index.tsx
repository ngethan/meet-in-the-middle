import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating Animation (Up and Down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1, // Move up
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, // Move down
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade-in Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Interpolating floatAnim to move up and down
  const floatingY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -10], // Moves smoothly up & down
  });

  return (
    <Link href="/auth" asChild>
      <TouchableOpacity style={styles.container} activeOpacity={0.8}>
        <View style={styles.topContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
            Oddyseez
          </Animated.Text>
          <Animated.Text style={[styles.sloganText, { opacity: fadeAnim }]}>
              Where Every Trip Start Together
          </Animated.Text>
        </View>

        <View style={styles.bottomContainer}>
          <Animated.Text
            style={[
              styles.continueText,
              { opacity: fadeAnim, transform: [{ translateY: floatingY }] },
            ]}
          >
            Tap anywhere to continue
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffd69d',
  },
  topContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 0.5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 130,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1D3D47',
    textAlign: 'center',
    marginBottom: 40, 
  },
  sloganText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3D47',
    textAlign: 'center',
  },
  continueText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1D3D47',
    opacity: 0.8,
  },
});
