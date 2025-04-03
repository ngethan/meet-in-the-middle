import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { ArrowLeft, Ticket } from "lucide-react-native";
import moment from "moment";
import { useLocalSearchParams } from "expo-router";

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
      console.log("Event details:", eventDetails);
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
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="mt-4 text-lg text-gray-800">Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Event not found!</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <Image source={{ uri: event.image }} className="w-full h-[45vh]" />

      <View className="px-5 py-4">
        <Text className="text-3xl font-bold text-gray-900">{event.title}</Text>
        <Text className="text-lg text-gray-700 mt-2">
          {event.date} | {event.time}
        </Text>
      </View>

      <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
        <Text className="text-xl font-semibold text-gray-900">Venue</Text>
        <Text className="text-lg text-gray-700 mt-2">{event.venue}</Text>
        <Text className="text-gray-500">{event.venueAddress}</Text>
        <Text className="text-gray-500">
          {event.city}, {event.country}
        </Text>
      </View>

      <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
        <Text className="text-xl font-semibold text-gray-900">Promoter</Text>
        <Text className="text-lg text-gray-700 mt-2">{event.promoter}</Text>
      </View>

      <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
        <Text className="text-xl font-semibold text-gray-900">
          Age Restrictions
        </Text>
        <Text className="text-lg text-gray-700 mt-2">
          {event.ageRestrictions}
        </Text>
      </View>

      <View className="px-5 py-4 mt-4 bg-white rounded-xl mx-5 shadow-lg">
        <Text className="text-xl font-semibold text-gray-900">
          Event Details
        </Text>
        <Text className="text-lg text-gray-700 mt-2">{event.description}</Text>
      </View>

      <View className="bg-white px-5 py-4 rounded-xl mx-5 shadow-lg mt-4">
        <Text className="text-xl font-semibold text-gray-900">Sales Info</Text>
        <Text className="text-lg text-gray-700 mt-2">{event.sales}</Text>
      </View>

      {event.seatmap && (
        <View className="mt-4">
          <Image
            source={{ uri: event.seatmap }}
            className="w-full h-[300px] rounded-lg"
            resizeMode="contain"
          />
        </View>
      )}

      <TouchableOpacity
        className="bg-yellow-500 py-3 mx-5 rounded-lg shadow-lg flex items-center justify-center mt-6"
        onPress={() => Linking.openURL(event.ticketUrl)}
      >
        <Text className="text-white font-semibold text-lg">Buy Tickets</Text>
        <Ticket size={24} color="white" className="ml-2" />
      </TouchableOpacity>
    </ScrollView>
  );
}
