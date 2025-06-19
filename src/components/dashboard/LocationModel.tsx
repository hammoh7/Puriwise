"use client";
import { getCoordsFromLocation, getLocationFromCoords } from "@/utils/geoCodeUtils";
import { useState } from "react";

interface LocationModelProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (locationData: { location: string; lat: number; lon: number }) => void;
}

const LocationModel = ({ isOpen, onClose, onLocationSet }: LocationModelProps) => {
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  if (!isOpen) return null;

  const handleAllowAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = await getLocationFromCoords(latitude, longitude);
          onLocationSet({ location, lat: latitude, lon: longitude });
          onClose();
        },
        (error) => {
          console.error("Geolocation error:", error);
          let message = "Unable to retrieve your location. Please try again.";
          if (error.code === error.PERMISSION_DENIED) {
            message = "Location access denied. Please enable location access in your browser settings and try again.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = "Location information is unavailable. Please try again later.";
          } else if (error.code === error.TIMEOUT) {
            message = "The request to get your location timed out. Please try again.";
          }
          alert(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by your browser. Please add your location manually.");
    }
  };

  const handleAddManually = () => {
    setMode("manual");
  };

  const handleSubmitManual = async () => {
    if (city && postalCode) {
      const locationQuery = `${city}, ${postalCode}`;
      try {
        const { lat, lon } = await getCoordsFromLocation(locationQuery);
        onLocationSet({ location: locationQuery, lat, lon });
        onClose();
      } catch (error) {
        alert("Invalid location. Please enter a valid city and postal code.");
      }
    } else {
      alert("Please enter both city and postal code.");
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50">
      <div
        className="bg-gradient-to-br from-blue-100 to-white p-6 rounded-lg shadow-lg max-w-sm w-full relative"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl"
        >
          ❌
        </button>
        {mode === "select" ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Set Your Location</h2>
            <p className="mb-6 text-gray-600">How would you like to set your location?</p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleAllowAccess}
                className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
              >
                Allow Access
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Enter Your Location</h2>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
            />
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter postal code"
            />
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleSubmitManual}
                className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300 transform hover:scale-105"
              >
                Submit
              </button>
              <button
                onClick={() => setMode("select")}
                className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-300 transform hover:scale-105"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationModel;