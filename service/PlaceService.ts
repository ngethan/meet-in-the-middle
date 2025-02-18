import axios from "axios";
import * as Location from "expo-location";

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
const RADIUS = 50000; // 50 km

class PlaceService {
  static async getUserLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permission to access location was denied");
    }
    return await Location.getCurrentPositionAsync({});
  }

  static async fetchPopularDestinations(latitude: number, longitude: number) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: RADIUS,
            type: "tourist_attraction",
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );

      let results = response.data.results.map((place: any) => ({
        id: place.place_id,
        title: place.name,
        description: place.vicinity || "Popular place nearby.",
        image: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
          : "https://via.placeholder.com/400",
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }));

      return results;
    } catch (error) {
      console.error("Error fetching places:", error);
      throw error;
    }
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1)); // Distance in km
  }
}

export default PlaceService;
