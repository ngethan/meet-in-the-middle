import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, Link} from 'expo-router';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign In & Sign Up
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Authentication Box */}
      <View style={styles.authBox}>
        <Text style={styles.authTitle}>{isSignUp ? 'Create An Account' : 'Sign into your account'}</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput placeholder="Email" placeholderTextColor="#666" style={styles.input} />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput placeholder="Password" placeholderTextColor="#666" secureTextEntry style={styles.input} />
        </View>

        {/* Password Confirmation (Only for Sign Up) */}
        {isSignUp && (
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.input}
            />
          </View>
        )}

        {/* Sign In / Create Account Button */}
        <TouchableOpacity style={styles.authButton}>
          <Text style={styles.authButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
        </TouchableOpacity>

        {/* Social Login (Only for Sign In) */}
        {!isSignUp && (
          <View style={styles.socialLogin}>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={require('../assets/images/apple-logo.png')} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={require('../assets/images/google-logo.png')} style={styles.socialIcon} />
            </TouchableOpacity>
          </View>
        )}

        {/* Toggle Between Sign In & Sign Up */}
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? ' : 'Not a member? '}
            <Text style={styles.toggleLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <Link href="/home">
        <Text style={styles.link}>Skip to Home</Text>
      </Link>
    </View>
    
  );
}

const styles = StyleSheet.create({
  link: { 
    marginTop:200, 
    color: '#1D3D47', 
    textDecorationLine: 'underline' 
},

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  authBox: {
    width: '85%',
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    width: '100%',
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  socialLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  socialButton: {
    width: 150,
    height: 50,
    backgroundColor: '#999999',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  toggleText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333',
  },
  toggleLink: {
    fontWeight: 'bold',
    color: '#000',
  },
});
