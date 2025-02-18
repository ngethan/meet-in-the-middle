import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  AppState, 
  Alert, 
  ActivityIndicator 
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "../lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState(""); // ✅ Full Name State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [_, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // ✅ Check if user is logged in & verified
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { user } = data;
        
        // Check if email is verified
        if (user.email_confirmed_at) {
          router.replace("/(tabs)/home"); // 🚀 Redirect to app
        }
      }
    };
    checkUser();
  }, []);

  // ✅ Email & Password Sign In
  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // 🚀 Redirect if email is verified
      if (data.user?.email_confirmed_at) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Check Email", "Verify your email before signing in.");
      }
    }

    setLoading(false);
  }

  // ✅ Email & Password Sign Up (With Full Name)
  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // ✅ Store Full Name in `users` table
      const userId = data?.user?.id;
      if (userId) {
        await supabase.from("users").insert([{ id: userId, email, full_name: fullName }]);
      }
      Alert.alert("Verify Email", "Check your inbox to verify your email!");
    }

    setLoading(false);
  }

  // ✅ Sign Out
  async function signOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) Alert.alert("Error", error.message);
    else setUser(null);

    setLoading(false);
  }

  // ✅ Reset Password
  async function resetPassword() {
    if (!email) return Alert.alert("Error", "Enter your email to reset password");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Password reset email sent!");

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      {/* Authentication Box */}
      <View style={styles.authBox}>
        <Text style={styles.authTitle}>{isSignUp ? "Create Account" : "Sign In"}</Text>

        {/* Full Name Input (Only for Sign Up) */}
        {isSignUp && (
          <View style={styles.inputContainer}>
            <TextInput 
              placeholder="Full Name"
              placeholderTextColor="#666"
              style={styles.input}
              value={fullName}
              autoCapitalize="words"
              onChangeText={setFullName}
            />
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Email"
            placeholderTextColor="#666"
            style={styles.input}
            value={email}
            autoCapitalize="none"
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.input}
            value={password}
            autoCapitalize="none"
            onChangeText={setPassword}
          />
        </View>

        {/* Confirm Password for Sign Up */}
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

        {/* Sign In / Sign Up Button */}
        <TouchableOpacity 
          style={styles.authButton} 
          disabled={loading} 
          onPress={isSignUp ? signUpWithEmail : signInWithEmail}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUp ? "Sign Up" : "Sign In"}</Text>}
        </TouchableOpacity>

        {/* Forgot Password */}
        {!isSignUp && (
          <TouchableOpacity onPress={resetPassword}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {/* Social Login */}
        <View style={styles.socialLogin}>
          {/* Apple Sign-In */}
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={5}
            style={styles.button}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                Alert.alert("Success", "You are now logged in with Apple!");
              } catch (e: any) {
                Alert.alert("Error", e.message || "Something went wrong.");
              }
            }}
          />
        </View>

        {/* Toggle Sign In / Sign Up */}
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleText}>
            {isSignUp ? "Already have an account? " : "Not a member? "}
            <Text style={styles.toggleLink}>{isSignUp ? "Sign in" : "Create an account"}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  link: { 
    marginTop: 20, 
    color: "#1D3D47", 
    textDecorationLine: "underline",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  authBox: {
    width: "85%",
    height: "45%",
    backgroundColor: "#FFA500",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  socialLogin: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 15,
  },
  button: {
    width: 200,
    height: 44,
    marginBottom: 10,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    fontSize: 16,
    color: "#333",
  },
  authButton: {
    width: "100%",
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  forgotPassword: {
    marginTop: 10,
    color: "#FFF",
    textDecorationLine: "underline",
  },
  toggleText: {
    marginTop: 20,
    fontSize: 14,
    color: "#333",
  },
  toggleLink: {
    fontWeight: "bold",
    color: "#000",
  },
});
