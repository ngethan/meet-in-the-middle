// import React from "react";
// import { View, Modal, Animated, Easing, Image } from "react-native";
// import { useEffect, useRef } from "react";

// // 🚗 Car animation images
// const carImage = require("@/assets/images/car.png"); // Replace with actual car image path

// export default function LoadingOverlay({ visible, type = "dots" }) {
//   // Animations for dots
//   const dot1 = useRef(new Animated.Value(0)).current;
//   const dot2 = useRef(new Animated.Value(0)).current;
//   const dot3 = useRef(new Animated.Value(0)).current;

//   // 🚗 Car animation
//   const carPosition = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       if (type === "dots") {
//         startDotAnimation();
//       } else if (type === "car") {
//         startCarAnimation();
//       }
//     }
//   }, [visible]);

//   // 🔵 Three Dots Animation
//   const startDotAnimation = () => {
//     Animated.loop(
//       Animated.stagger(200, [
//         Animated.sequence([
//           Animated.timing(dot1, { toValue: -10, duration: 300, useNativeDriver: true }),
//           Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
//         ]),
//         Animated.sequence([
//           Animated.timing(dot2, { toValue: -10, duration: 300, useNativeDriver: true }),
//           Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
//         ]),
//         Animated.sequence([
//           Animated.timing(dot3, { toValue: -10, duration: 300, useNativeDriver: true }),
//           Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
//         ]),
//       ])
//     ).start();
//   };

//   // 🚗 Car Animation (Moves left & right)
//   const startCarAnimation = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(carPosition, {
//           toValue: 20,
//           duration: 500,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//         Animated.timing(carPosition, {
//           toValue: -20,
//           duration: 500,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   if (!visible) return null;

//   return (
//     <Modal transparent animationType="fade" visible={visible}>
//       <View className="absolute inset-0 bg-black/50 flex justify-center items-center">
//         {type === "dots" ? (
//           // 🔵 Three Jumping Dots Animation
//           <View className="flex-row space-x-2">
//             <Animated.View
//               className="w-4 h-4 bg-white rounded-full"
//               style={{ transform: [{ translateY: dot1 }] }}
//             />
//             <Animated.View
//               className="w-4 h-4 bg-white rounded-full"
//               style={{ transform: [{ translateY: dot2 }] }}
//             />
//             <Animated.View
//               className="w-4 h-4 bg-white rounded-full"
//               style={{ transform: [{ translateY: dot3 }] }}
//             />
//           </View>
//         ) : (
//           // 🚗 Car Driving Animation
//           <Animated.View style={{ transform: [{ translateX: carPosition }] }}>
//             <Image source={carImage} className="w-12 h-6" resizeMode="contain" />
//           </Animated.View>
//         )}
//       </View>
//     </Modal>
//   );
// }

import React, { useEffect, useRef } from "react";
import { View, Modal, Animated, Easing, Text } from "react-native";

export default function LoadingOverlay({
  visible,
  type = "dots",
  message = "Loading...",
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 justify-center items-center bg-black/50 absolute inset-0">
        {type === "dots" ? (
          <View className="flex-row space-x-2">
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "white",
                  opacity: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                  transform: [
                    {
                      translateY: animatedValue.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, -10, 0],
                      }),
                    },
                  ],
                }}
              />
            ))}
          </View>
        ) : (
          <Animated.Image
            source={require("@/assets/images/car-loading.gif")} // Replace with your car animation GIF
            style={{
              width: 80,
              height: 40,
              transform: [
                {
                  translateX: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 50],
                  }),
                },
              ],
            }}
          />
        )}
        <Text className="text-white text-lg mt-4">
          {message || "Loading..."}
        </Text>
      </View>
    </Modal>
  );
}
