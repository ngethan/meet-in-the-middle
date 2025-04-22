// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   ScrollView,
//   Linking,
//   ActivityIndicator,
// } from "react-native";
// import axios from "axios";
// import { ArrowLeft, Calendar, Clock, Info, MapPin, Ticket } from "lucide-react-native";
// import moment from "moment";
// import { useLocalSearchParams } from "expo-router";

// const TICKETMASTER_API_KEY = "e48QyQe8dYPBlcGspizf6dtnvpGfDojV";

// export default function EventDetail() {
//   const { id } = useLocalSearchParams();
//   const [event, setEvent] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchEventDetails = async () => {
//     try {
//       const response = await axios.get(
//         `https://app.ticketmaster.com/discovery/v2/events/${id}`,
//         {
//           params: {
//             apikey: TICKETMASTER_API_KEY,
//           },
//         },
//       );

//       const eventData = response.data;
//       const eventDetails = {
//         id: eventData.id,
//         title: eventData.name,
//         description: eventData.info || "No description available.",
//         date: eventData.dates.start.localDate,
//         time: eventData.dates.start.localTime,
//         venue: eventData._embedded.venues[0].name,
//         venueAddress: eventData._embedded.venues[0].address.line1,
//         city: eventData._embedded.venues[0].city.name,
//         country: eventData._embedded.venues[0].country.name,
//         promoter: eventData.promoter?.name || "No promoter info",
//         image: eventData.images[0]?.url || "https://via.placeholder.com/400",
//         ticketUrl: eventData.url,
//         seatmap: eventData.seatmap?.staticUrl,
//         parking: eventData.parkingDetail || "No parking info",
//         ageRestrictions: eventData.ageRestrictions?.legalAgeEnforced
//           ? "Age restrictions enforced"
//           : "No age restrictions",
//         sales: eventData.sales?.public.startDateTime
//           ? `Sales start at ${moment(eventData.sales.public.startDateTime).format("MMMM DD, YYYY - hh:mm A")}`
//           : "No public sales info",
//       };
//       console.log("Event details:", eventDetails);
//       setEvent(eventDetails);
//     } catch (error) {
//       console.error("Error fetching event details:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       fetchEventDetails();
//     }
//   }, [id]);

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" color="#fbbf24" />
//         <Text className="mt-4 text-lg text-gray-800">Loading event...</Text>
//       </View>
//     );
//   }

//   if (!event) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <Text className="text-lg text-red-500">Event not found!</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-neutral-50" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
// //       <ScrollView className="flex-1" bounces={false}>
// //         <View className="relative">
//     {/* <ScrollView className="flex-1 bg-gray-100"> */}
//       <Image source={{ uri: event.image }} className="w-full h-[45vh]" />

//       <View className="px-5 py-4">
//         <Text className="text-3xl font-bold text-gray-900">{event.title}</Text>
//         <Text className="text-lg text-gray-700 mt-2">
//           {event.date} | {event.time}
//         </Text>
//       </View>

//       <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
//         <Text className="text-xl font-semibold text-gray-900">Venue</Text>
//         <Text className="text-lg text-gray-700 mt-2">{event.venue}</Text>
//         <Text className="text-gray-500">{event.venueAddress}</Text>
//         <Text className="text-gray-500">
//           {event.city}, {event.country}
//         </Text>
//       </View>

//       <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
//         <Text className="text-xl font-semibold text-gray-900">Promoter</Text>
//         <Text className="text-lg text-gray-700 mt-2">{event.promoter}</Text>
//       </View>

//       <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
//         <Text className="text-xl font-semibold text-gray-900">
//           Age Restrictions
//         </Text>
//         <Text className="text-lg text-gray-700 mt-2">
//           {event.ageRestrictions}
//         </Text>
//       </View>

//       <View className="px-5 py-4 mt-4 bg-white rounded-xl mx-5 shadow-lg">
//         <Text className="text-xl font-semibold text-gray-900">
//           Event Details
//         </Text>
//         <Text className="text-lg text-gray-700 mt-2">{event.description}</Text>
//       </View>

//       <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
//         <Text className="text-xl font-semibold text-gray-900">Sales Info</Text>
//         <Text className="text-lg text-gray-700 mt-2">{event.sales}</Text>
//       </View>

//       {event.seatmap && (
//         <View className="mt-4">
//           <Image
//             source={{ uri: event.seatmap }}
//             className="w-full h-[300px] rounded-lg"
//             resizeMode="contain"
//           />
//         </View>
//       )}

//       <TouchableOpacity
//         className="bg-yellow-500 py-3 mx-5 rounded-lg shadow-lg flex items-center justify-center mt-6"
//         onPress={() => Linking.openURL(event.ticketUrl)}
//       >
//         <Text className="text-white font-semibold text-lg">Buy Tickets</Text>
//         <Ticket size={24} color="white" className="ml-2" />
//       </TouchableOpacity>

//     </ScrollView>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import axios from "axios";
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Calendar,
  Clock,
  Info,
} from "lucide-react-native";
import moment from "moment";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const TICKETMASTER_API_KEY = "e48QyQe8dYPBlcGspizf6dtnvpGfDojV";

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events/${id}`,
        {
          params: {
            apikey: TICKETMASTER_API_KEY,
          },
        },
      );

      const eventData = response.data;
      const eventDetails = {
        id: eventData.id,
        title: eventData.name,
        description: eventData.info || "No description available.",
        date: eventData.dates.start.localDate,
        time: eventData.dates.start.localTime,
        venue: eventData._embedded.venues[0].name,
        venueAddress: eventData._embedded.venues[0].address.line1,
        city: eventData._embedded.venues[0].city.name,
        country: eventData._embedded.venues[0].country.name,
        promoter: eventData.promoter?.name || "No promoter info",
        image: eventData.images[0]?.url || "https://via.placeholder.com/400",
        ticketUrl: eventData.url,
        seatmap: eventData.seatmap?.staticUrl,
        parking: eventData.parkingDetail || "No parking info",
        ageRestrictions: eventData.ageRestrictions?.legalAgeEnforced
          ? "Age restrictions enforced"
          : "No age restrictions",
        sales: eventData.sales?.public.startDateTime
          ? `Sales start at ${moment(eventData.sales.public.startDateTime).format("MMMM DD, YYYY - hh:mm A")}`
          : "No public sales info",
      };

      setEvent(eventDetails);
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-base text-neutral-600">
          Loading event details...
        </Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-50">
        <Text className="text-lg text-red-500">Event not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-neutral-200 rounded-ios"
        >
          <Text className="text-neutral-800">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section with Image */}
        <View className="relative">
          <Image
            source={{ uri: event.image }}
            className="w-full h-[45vh]"
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center"
            style={{ elevation: 3 }}
          >
            <ArrowLeft size={22} color="white" />
          </TouchableOpacity>

          <View className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-5 py-6">
            <Text className="text-white text-3xl font-bold">{event.title}</Text>
            <Text className="text-white/90 text-base mt-1">
              {moment(event.date).format("ddd, MMM D")} •{" "}
              {moment(event.time, "HH:mm:ss").format("h:mm A")}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-5 py-6">
          {/* Date & Time Card */}
          <View className="bg-neutral-50 rounded-2xl p-4 mb-5 shadow-sm border border-neutral-100">
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color="#0066CC" />
              <Text className="text-base font-medium text-neutral-800 ml-3">
                {moment(event.date).format("dddd, MMMM D, YYYY")}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Clock size={18} color="#0066CC" />
              <Text className="text-base font-medium text-neutral-800 ml-3">
                {moment(event.time, "HH:mm:ss").format("h:mm A")}
              </Text>
            </View>
          </View>

          {/* Venue Information */}
          <View className="bg-neutral-50 rounded-2xl p-5 mb-5 shadow-sm border border-neutral-100">
            <View className="flex-row items-center mb-3">
              <MapPin size={18} color="#0066CC" />
              <Text className="text-lg font-semibold text-neutral-800 ml-3">
                Location
              </Text>
            </View>

            <View className="ml-7">
              <Text className="text-base font-medium text-neutral-800">
                {event.venue}
              </Text>
              <Text className="text-sm text-neutral-600 mt-1">
                {event.venueAddress}
              </Text>
              <Text className="text-sm text-neutral-600">
                {event.city}, {event.country}
              </Text>

              <TouchableOpacity
                className="mt-3 flex-row items-center"
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${event.venue} ${event.city}`,
                  )
                }
              >
                <Text className="text-blue-600 font-medium">View on map</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Details */}
          <View className="bg-neutral-50 rounded-2xl p-5 mb-5 shadow-sm border border-neutral-100">
            <View className="flex-row items-center mb-3">
              <Info size={18} color="#0066CC" />
              <Text className="text-lg font-semibold text-neutral-800 ml-3">
                About Event
              </Text>
            </View>

            <Text className="text-base text-neutral-700 leading-relaxed ml-7">
              {event.description}
            </Text>
          </View>

          {/* Seatmap */}
          {event.seatmap && (
            <View className="mb-5">
              <Text className="text-lg font-semibold text-neutral-800 mb-3">
                Seating Chart
              </Text>
              <Image
                source={{ uri: event.seatmap }}
                className="w-full h-[250px] rounded-2xl"
                resizeMode="contain"
              />
            </View>
          )}

          {/* Ticket Button */}
          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center mb-8 shadow-md"
            onPress={() => Linking.openURL(event.ticketUrl)}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg mr-2">
              Get Tickets
            </Text>
            <Ticket size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
