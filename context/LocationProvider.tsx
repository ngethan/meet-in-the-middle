import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import * as Location from "expo-location";
// Create the Context
const LocationContext = createContext<{
  types: string[];
  setTypes: (types: string[]) => void;
}>({
  types: [],
  setTypes: () => {},
});

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const RADIUS = 50000;

export const LocationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [locationTypes, setLocationTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission Denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: RADIUS,
            type: "tourist_attraction",
            key: GOOGLE_MAPS_API_KEY,
          },
        },
      );
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
          },
        );

        let results = response.data.results.map((place: any) => ({
          types: place.types,
        }));

        const uniqueTypes = [
          ...new Set(results.flatMap((dest: any) => dest.types)),
        ];

        setLocationTypes(uniqueTypes as string[]);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  return (
    <LocationContext.Provider
      value={{ types: locationTypes, setTypes: setLocationTypes }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// Custom Hook to use location types
export const useLocationTypes = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationTypes must be used within a LocationProvider");
  }
  return { types: context.types, setTypes: context.setTypes };
};
