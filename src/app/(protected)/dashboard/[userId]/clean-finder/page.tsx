"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { googleMapsLoader } from "@/utils/googleLoader";
import { getLocationFromCoords } from "@/utils/geoCodeUtils";
import { useRoute } from "@/context/RouteContext";
import { useRouter } from "next/navigation";
import HeaderBar from "@/components/dashboard/Headerbar";

interface SavedRoute {
  id: string;
  name: string | null;
  routeType: string;
  polyline: string;
  exposure: number;
  distance: number;
  time: number;
  start: { type: string; coordinates: [number, number] };
  startName?: string | null;
  end: { type: string; coordinates: [number, number] };
  endName?: string | null;
  createdAt: string;
  mode: string;
}

const CleanAirFinder = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { setRouteData } = useRoute();
  const [start, setStart] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [end, setEnd] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [routes, setRoutes] = useState<{
    fastest: {
      polyline: string;
      distance: number;
      time: number;
      exposure: number;
    };
    cleanest: {
      polyline: string;
      distance: number;
      time: number;
      exposure: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [mode, setMode] = useState<"walking" | "cycling">("walking");
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/user/${user.uid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const data = await response.json();
        setUserProfileId(data.id);
        setUserLocation({
          lat: data.currentLat ?? null,
          lng: data.currentLon ?? null,
        });
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (!userProfileId) return;

    const fetchSavedRoutes = async () => {
      try {
        const response = await fetch(
          `/api/saved-routes?userId=${userProfileId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch saved routes");
        }
        const data = await response.json();
        setSavedRoutes(data);
      } catch (err) {
        console.error("Error fetching saved routes:", err);
        setError("Failed to load saved routes");
      }
    };

    fetchSavedRoutes();
  }, [userProfileId]);

  useEffect(() => {
    let isMounted = true;

    googleMapsLoader
      .load()
      .then(() => {
        if (!isMounted || !mapRef.current) return;

        const defaultCenter = { lat: 18.5204, lng: 73.8567 };
        const center =
          userLocation.lat !== null && userLocation.lng !== null
            ? { lat: userLocation.lat, lng: userLocation.lng }
            : defaultCenter;
        const zoom =
          userLocation.lat !== null && userLocation.lng !== null ? 14 : 10;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#fef3c7" }],
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [{ color: "#93c5fd" }],
            },
          ],
        });
        setMap(mapInstance);

        if (!google.maps.geometry) {
          console.error("Geometry library not loaded");
          setError("Map initialization failed: Geometry library missing");
          return;
        }

        if (startInputRef.current && endInputRef.current) {
          const startAutocomplete = new google.maps.places.Autocomplete(
            startInputRef.current
          );
          const endAutocomplete = new google.maps.places.Autocomplete(
            endInputRef.current
          );

          startAutocomplete.addListener("place_changed", () => {
            const place = startAutocomplete.getPlace();
            if (place.geometry?.location) {
              setStart({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name:
                  place.formatted_address || place.name || "Unknown location",
              });
              if (map) {
                map.setCenter({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                });
              }
            } else {
              console.warn("No geometry for start place");
            }
          });

          endAutocomplete.addListener("place_changed", () => {
            const place = endAutocomplete.getPlace();
            if (place.geometry?.location) {
              setEnd({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name:
                  place.formatted_address || place.name || "Unknown location",
              });
            } else {
              console.warn("No geometry for end place");
            }
          });
        }
      })
      .catch((error) => {
        console.error("Google Maps Loader error:", error);
        setError("Failed to load map");
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const location = await getLocationFromCoords(latitude, longitude);
            setStart({
              lat: latitude,
              lng: longitude,
              name: location,
            });
            if (startInputRef.current) {
              startInputRef.current.value = location;
            }
            if (map) {
              map.setCenter({ lat: latitude, lng: longitude });
            }
            try {
              const response = await fetch(`/api/user/${user?.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentLat: latitude,
                  currentLon: longitude,
                  currentLocation: location,
                }),
              });
              if (response.ok) {
                setUserLocation({ lat: latitude, lng: longitude });
              } else {
                console.error("Failed to update user profile with location");
              }
            } catch (err) {
              console.error("Error updating user profile:", err);
            }
          } catch (error) {
            console.error("Geolocation reverse geocoding error:", error);
            setError("Failed to get location name. Using coordinates only.");
            setStart({
              lat: latitude,
              lng: longitude,
              name: `${latitude}, ${longitude}`,
            });
            if (startInputRef.current) {
              startInputRef.current.value = `${latitude}, ${longitude}`;
            }
            if (map) {
              map.setCenter({ lat: latitude, lng: longitude });
            }
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          setIsLoading(false);
          let message = "Unable to retrieve your location. Please try again.";
          if (error.code === error.PERMISSION_DENIED) {
            message =
              "Location access denied. Please enable location access in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message =
              "Location information is unavailable. Please try again later.";
          } else if (error.code === error.TIMEOUT) {
            message =
              "The request to get your location timed out. Please try again.";
          }
          setError(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setError(
        "Geolocation is not supported by your browser. Please enter a location manually."
      );
    }
  };

  const fetchRoutes = async () => {
    if (!start || !end || !userProfileId || !map) return;

    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch(
        `/api/cleanroute?startLat=${start.lat}&startLng=${start.lng}&endLat=${end.lat}&endLng=${end.lng}&userId=${userProfileId}&mode=${mode}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch routes: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Received route data:", data);
      setRoutes(data);

      polylinesRef.current.forEach((poly) => poly?.setMap(null));
      polylinesRef.current = [];

      const decodePolyline = (polylineString: string) => {
        try {
          if (!polylineString || typeof polylineString !== "string") {
            console.error("Invalid polyline:", polylineString);
            return [];
          }
          return google.maps.geometry.encoding.decodePath(polylineString);
        } catch (error) {
          console.error("Polyline decoding error:", error);
          return [];
        }
      };

      const fastestPath = new google.maps.Polyline({
        path: decodePolyline(data.fastest.polyline),
        strokeColor: "#3B82F6",
        strokeOpacity: 0.8,
        strokeWeight: 5,
        zIndex: 10,
        map: map,
      });

      const cleanestPath = new google.maps.Polyline({
        path: decodePolyline(data.cleanest.polyline),
        strokeColor: "#10B981",
        strokeOpacity: 0.8,
        strokeWeight: 5,
        zIndex: 5,
        map: map,
      });

      polylinesRef.current = [fastestPath, cleanestPath];

      const bounds = new google.maps.LatLngBounds();
      decodePolyline(data.fastest.polyline).forEach((point) =>
        bounds.extend(point)
      );
      decodePolyline(data.cleanest.polyline).forEach((point) =>
        bounds.extend(point)
      );
      map.fitBounds(bounds);
    } catch (error) {
      console.error("Error fetching routes:", error);
      setError(`Failed to fetch or display routes: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateRoute = (typeOrRoute: "fastest" | "cleanest" | SavedRoute) => {
    let routeData;
    if (typeof typeOrRoute === "string") {
      if (!routes || !start || !end) return;
      routeData = {
        polyline: routes[typeOrRoute].polyline,
        routeType: typeOrRoute,
        distance: routes[typeOrRoute].distance,
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng },
        mode: mode,
      };
    } else {
      routeData = {
        polyline: typeOrRoute.polyline,
        routeType: typeOrRoute.routeType,
        distance: typeOrRoute.distance,
        start: {
          lat: typeOrRoute.start.coordinates[1],
          lng: typeOrRoute.start.coordinates[0],
        },
        end: {
          lat: typeOrRoute.end.coordinates[1],
          lng: typeOrRoute.end.coordinates[0],
        },
        mode: typeOrRoute.mode,
      };
    }
    setRouteData(routeData);
    router.push(`/dashboard/${user?.uid}/clean-finder/navigate`);
  };

  const saveRoute = async (type: "fastest" | "cleanest") => {
    if (!routes || !userProfileId || !start || !end) return;
    const route = routes[type];
    try {
      const response = await fetch("/api/save-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfileId,
          name: `${type} Route from ${start.name || "Unknown"} to ${
            end.name || "Unknown"
          }`,
          start: { type: "Point", coordinates: [start.lng, start.lat] },
          startName: start.name || "Unknown",
          end: { type: "Point", coordinates: [end.lng, end.lat] },
          endName: end.name || "Unknown",
          routeType: type,
          polyline: route.polyline,
          exposure: route.exposure,
          distance: route.distance,
          time: route.time,
          mode: mode,
        }),
      });
      if (!response.ok) throw new Error("Failed to save route");

      const savedResponse = await fetch(
        `/api/saved-routes?userId=${userProfileId}`
      );
      if (savedResponse.ok) {
        const data = await savedResponse.json();
        setSavedRoutes(data);
      }

      alert("Route saved successfully!");
    } catch (error) {
      console.error("Error saving route:", error);
      setError(`Failed to save route: ${String(error)}`);
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!userProfileId) return;
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      const response = await fetch("/api/save-route", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId, userId: userProfileId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete route: ${response.status} - ${errorText}`
        );
      }

      const savedResponse = await fetch(
        `/api/saved-routes?userId=${userProfileId}`
      );
      if (savedResponse.ok) {
        const data = await savedResponse.json();
        setSavedRoutes(data);
      }

      alert("Route deleted successfully!");
    } catch (error) {
      console.error("Error deleting route:", error);
      setError(`Failed to delete route: ${String(error)}`);
    }
  };

  const displaySavedRoute = (route: SavedRoute) => {
    if (!map) return;

    polylinesRef.current.forEach((poly) => poly?.setMap(null));
    polylinesRef.current = [];

    const decodePolyline = (polylineString: string) => {
      try {
        if (!polylineString || typeof polylineString !== "string") {
          console.error("Invalid polyline:", polylineString);
          return [];
        }
        return google.maps.geometry.encoding.decodePath(polylineString);
      } catch (error) {
        console.error("Polyline decoding error:", error);
        return [];
      }
    };

    const path = new google.maps.Polyline({
      path: decodePolyline(route.polyline),
      strokeColor: route.routeType === "fastest" ? "#3B82F6" : "#10B981",
      strokeOpacity: 0.8,
      strokeWeight: 5,
      zIndex: 10,
      map: map,
    });

    polylinesRef.current = [path];

    const bounds = new google.maps.LatLngBounds();
    decodePolyline(route.polyline).forEach((point) => bounds.extend(point));
    map.fitBounds(bounds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      <HeaderBar onLocationClick={() => setIsLocationModalOpen(false)} />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 tracking-tight">
            🌟 Clean-Air Route Finder 🌟
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the cleanest paths to your destination and breathe easier
            on every journey
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/10 to-green-600/10 px-8 py-6 border-b border-gray-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Plan Your Clean Journey
              </h2>
              <p className="text-gray-600 text-sm">
                Enter your locations and choose your preferred travel mode
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Starting Point
                    </span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <input
                      ref={startInputRef}
                      type="text"
                      placeholder="Enter starting location..."
                      aria-label="Starting location"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-green-100 focus:border-green-400 outline-none transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 group-hover:border-gray-300 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Destination
                    </span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <input
                      ref={endInputRef}
                      type="text"
                      placeholder="Enter destination..."
                      aria-label="Destination"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 group-hover:border-gray-300 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Travel Mode
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
                      mode === "walking"
                        ? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    onClick={() => setMode("walking")}
                    aria-pressed={mode === "walking"}
                  >
                    <span className="text-2xl mr-3">🚶</span>
                    <div className="text-left">
                      <div className="font-semibold">Walking</div>
                      <div className="text-xs opacity-75">
                        Eco-friendly • Healthy
                      </div>
                    </div>
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
                      mode === "cycling"
                        ? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                    onClick={() => setMode("cycling")}
                    aria-pressed={mode === "cycling"}
                  >
                    <span className="text-2xl mr-3">🚴</span>
                    <div className="text-left">
                      <div className="font-semibold">Cycling</div>
                      <div className="text-xs opacity-75">Fast • Green</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleCurrentLocation}
                  disabled={isLoading}
                  className="flex-1 group relative px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  aria-label="Use current location"
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                        <span>Use My Location</span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={fetchRoutes}
                  disabled={!start || !end || !userProfileId || isLoading}
                  className="flex-1 group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Finding Routes...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                          ></path>
                        </svg>
                        <span>Find Clean Routes</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Getting Started
                    </h4>
                    <p className="text-sm text-blue-700">
                      Start typing to search for locations, use your current
                      location as a starting point, or enter specific addresses.
                      We'll find the cleanest air quality routes for your
                      journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8 border border-yellow-200">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              🗺️ Interactive Route Map
            </h2>
            <p className="text-gray-600">
              Blue line = Fastest Route | Green line = Cleanest Route
            </p>
          </div>
          <div
            ref={mapRef}
            className="w-full h-96 rounded-2xl shadow-inner border-2 border-yellow-100"
          />
        </div>

        {routes && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 shadow-xl border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-blue-800">
                  ⚡ Fastest Route
                </h2>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">
                    📏 Distance:
                  </span>
                  <span className="text-blue-700 font-bold">
                    {(routes.fastest.distance / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">⏱️ Time:</span>
                  <span className="text-blue-700 font-bold">
                    {Math.round(routes.fastest.time / 60)} minutes
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">
                    🌫️ Exposure Score:
                  </span>
                  <span className="text-blue-700 font-bold">
                    {routes.fastest.exposure.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigateRoute("fastest")}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  🧭 Navigate
                </button>
                <button
                  onClick={() => saveRoute("fastest")}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  💾 Save Route
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 shadow-xl border border-green-200">
              <div className="flex items-center mb-6">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-green-800">
                  🌿 Cleanest Route
                </h2>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">
                    📏 Distance:
                  </span>
                  <span className="text-green-700 font-bold">
                    {(routes.cleanest.distance / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">⏱️ Time:</span>
                  <span className="text-green-700 font-bold">
                    {Math.round(routes.cleanest.time / 60)} minutes
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-xl">
                  <span className="font-semibold text-gray-700">
                    🌫️ Exposure Score:
                  </span>
                  <span className="text-green-700 font-bold">
                    {routes.cleanest.exposure.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigateRoute("cleanest")}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  🧭 Navigate
                </button>
                <button
                  onClick={() => saveRoute("cleanest")}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  💾 Save Route
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-yellow-200">
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              📚 Your Saved Routes
            </h2>
            <div className="ml-4 px-3 py-1 bg-yellow-400 text-gray-800 rounded-full text-sm font-semibold">
              {savedRoutes.length} saved
            </div>
          </div>

          {savedRoutes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗂️</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No saved routes yet
              </h3>
              <p className="text-gray-500">
                Start by finding and saving your first clean-air route!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => displaySavedRoute(route)}
                  className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer border border-yellow-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          route.routeType === "fastest"
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          route.routeType === "fastest"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {route.routeType} • {route.mode}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-800 mb-3 text-lg line-clamp-2">
                    {route.name || "Unnamed Route"}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({route.mode})
                    </span>
                  </h3>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">📏 Distance:</span>
                      <span className="font-semibold">
                        {(route.distance / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">⏱️ Time:</span>
                      <span className="font-semibold">
                        {Math.round(route.time / 60)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🌫️ Exposure:</span>
                      <span className="font-semibold">
                        {route.exposure.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    <div className="mb-1">
                      <span className="font-medium">📍 From:</span>{" "}
                      {route.startName ||
                        `${route.start.coordinates[1]}, ${route.start.coordinates[0]}`}
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">🎯 To:</span>{" "}
                      {route.endName ||
                        `${route.end.coordinates[1]}, ${route.end.coordinates[0]}`}
                    </div>
                    <div>
                      <span className="font-medium">💾 Saved:</span>{" "}
                      {new Date(route.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateRoute(route);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      🧭 Navigate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoute(route.id);
                      }}
                      className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanAirFinder;
