"use client";
import { useEffect, useRef, useState } from "react";
import { useRoute } from "@/context/RouteContext";
import { googleMapsLoader } from "@/utils/googleLoader";
import { fetchAQI } from "@/utils/aqiUtils";

const NavigationPage = () => {
  const { routeData } = useRoute();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userPosition, setUserPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [navigationSteps, setNavigationSteps] = useState<
    google.maps.DirectionsStep[]
  >([]);
  const [showStartOption, setShowStartOption] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean | null>(
    null
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const routePathRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!routeData || !mapRef.current) return;

    googleMapsLoader
      .load()
      .then((google) => {
        if (!mapRef.current) return;
        mapRef.current.style.height = "100vh";
        mapRef.current.style.width = "100vw";

        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 15,
          center: {
            lat: (routeData.start.lat + routeData.end.lat) / 2,
            lng: (routeData.start.lng + routeData.end.lng) / 2,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          disableDefaultUI: true,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ hue: "#ffd700" }, { saturation: 15 }, { lightness: 5 }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e8f4f8" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#fffbf0" }]
            }
          ]
        });
        setMap(mapInstance);

        const path = google.maps.geometry.encoding.decodePath(
          routeData.polyline
        );
        const routeColor = routeData.routeType === "fastest" ? "#FF6B35" : "#4ECDC4";
        routePathRef.current = new google.maps.Polyline({
          path,
          strokeColor: routeColor,
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map: mapInstance,
        });

        new google.maps.Marker({
          position: routeData.start,
          map: mapInstance,
          title: "Start Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#4ECDC4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 3,
          },
        });

        new google.maps.Marker({
          position: routeData.end,
          map: mapInstance,
          title: "Destination",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#FF6B35",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 3,
          },
        });

        const bounds = new google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        mapInstance.fitBounds(bounds);
      })
      .catch((error) => console.error("Google Maps Loader error:", error));
  }, [routeData]);

  useEffect(() => {
    if (!routeData || !map) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: routeData.start,
        destination: routeData.end,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setNavigationSteps(result.routes[0].legs[0].steps);
        } else {
          console.error("Directions API error:", status);
        }
      }
    );
  }, [routeData, map]);

  useEffect(() => {
    if (!navigationStarted || !map || !routeData || useCurrentLocation === null)
      return;

    setIsLoading(true);

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (useCurrentLocation) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setGeoError(
              "Location access is blocked. Please enable location access in your browser settings to use this feature."
            );
            setNavigationStarted(false);
            setUseCurrentLocation(null);
            setIsLoading(false);
            return;
          }

          watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude, speed } = position.coords;
              const newPosition = { lat: latitude, lng: longitude };
              setUserPosition(newPosition);
              setGeoError(null);
              setIsLoading(false);

              if (userMarkerRef.current) {
                userMarkerRef.current.setPosition(newPosition);
              } else {
                userMarkerRef.current = new google.maps.Marker({
                  position: newPosition,
                  map,
                  title: "Your current location",
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#FF6B35",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3,
                  },
                });
              }
              map.setCenter(newPosition);

              const currentAqi = await fetchAQI(latitude, longitude);
              setAqi(currentAqi);

              const path = google.maps.geometry.encoding.decodePath(
                routeData.polyline
              );
              const remainingDistance = calculateRemainingDistance(
                newPosition,
                path
              );
              const speedMps = speed || 1.4;
              setEstimatedTime(
                remainingDistance > 0
                  ? Math.round(remainingDistance / speedMps / 60)
                  : 0
              );
            },
            (error) => {
              setIsLoading(false);
              let errorMessage = "Location access error: ";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage =
                    "Location access denied. Please enable location permissions in your browser settings.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage =
                    "Your location is unavailable. Please check your device location services.";
                  break;
                case error.TIMEOUT:
                  errorMessage =
                    "Location request timed out. Please try again.";
                  break;
                default:
                  errorMessage =
                    "Unable to get your location. Please try again.";
              }
              console.error("Geolocation error:", error);
              setGeoError(errorMessage);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
    } else {
      setUserPosition(routeData.start);
      setIsLoading(false);

      userMarkerRef.current = new google.maps.Marker({
        position: routeData.start,
        map,
        title: "Start position",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF6B35",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      map.setCenter(routeData.start);

      fetchAQI(routeData.start.lat, routeData.start.lng).then(setAqi);

      const path = google.maps.geometry.encoding.decodePath(routeData.polyline);
      const remainingDistance = calculateRemainingDistance(
        routeData.start,
        path
      );
      setEstimatedTime(Math.round(remainingDistance / 1.4 / 60));
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [navigationStarted, map, routeData, useCurrentLocation]);

  const calculateRemainingDistance = (
    currentPos: google.maps.LatLngLiteral,
    path: google.maps.LatLng[]
  ) => {
    let minDistance = Infinity;
    let closestIndex = 0;
    path.forEach((point, index) => {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        currentPos,
        point
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    let remaining = 0;
    for (let i = closestIndex; i < path.length - 1; i++) {
      remaining += google.maps.geometry.spherical.computeDistanceBetween(
        path[i],
        path[i + 1]
      );
    }
    return remaining;
  };

  const handleStartOption = (useCurrent: boolean) => {
    setUseCurrentLocation(useCurrent);
    setShowStartOption(false);
    setNavigationStarted(true);
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "bg-teal-400";
    if (aqi <= 100) return "bg-yellow-400";
    if (aqi <= 150) return "bg-orange-400";
    if (aqi <= 200) return "bg-red-400";
    if (aqi <= 300) return "bg-purple-400";
    return "bg-red-600";
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <div className="h-screen w-screen relative m-0 p-0 overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div 
        ref={mapRef} 
        className={`h-full w-full transition-all duration-300 ${
          navigationStarted ? 'rounded-none' : 'rounded-3xl'
        }`}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-yellow-50/90 backdrop-blur-sm flex flex-col justify-center items-center z-[1002] animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-yellow-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="mt-5 text-yellow-800 text-base font-medium">
            Getting your location...
          </p>
        </div>
      )}

      {showStartOption && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[1000] animate-in fade-in duration-300"
          role="dialog"
          aria-labelledby="start-navigation-title"
          aria-describedby="start-navigation-description"
        >
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-10 rounded-3xl text-center max-w-[90%] w-[420px] shadow-2xl border border-yellow-200/50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-15 h-15 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">
              🧭
            </div>
            
            <h2 
              id="start-navigation-title"
              className="mb-3 text-yellow-800 text-2xl font-bold tracking-tight"
            >
              Start Your Journey
            </h2>
            
            <p 
              id="start-navigation-description"
              className="mb-8 text-yellow-700 text-base leading-relaxed"
            >
              Choose your starting point to begin navigation
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleStartOption(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartOption(true)}
                className="px-6 py-4 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-2xl font-semibold text-base shadow-lg shadow-teal-400/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-400/40 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
                aria-label="Start navigation from current location"
              >
                📍 Current Location
              </button>
              
              <button
                onClick={() => handleStartOption(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartOption(false)}
                className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-semibold text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/40 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                aria-label="Start navigation from selected starting location"
              >
                🎯 Selected Location
              </button>
            </div>
          </div>
        </div>
      )}

      {geoError && (
        <div
          className="absolute top-5 left-5 right-5 bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-500/30 z-[1001] flex justify-between items-start animate-in slide-in-from-top-4 duration-500"
          role="alert"
          aria-live="polite"
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <strong className="text-base">Location Error</strong>
            </div>
            <p className="m-0 text-sm leading-relaxed opacity-90">
              {geoError}
            </p>
          </div>
          <button
            onClick={() => {
              setGeoError(null);
              setNavigationStarted(false);
              setUseCurrentLocation(null);
            }}
            className="bg-white/20 hover:bg-white/30 text-white rounded-lg w-8 h-8 flex items-center justify-center text-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      <div className="absolute bottom-8 left-5 right-5 bg-gradient-to-br from-white/95 to-yellow-50/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-yellow-200/50 z-10 transition-all duration-300">
        {!navigationStarted ? (
          <div className="text-center">
            <button
              onClick={() => setShowStartOption(true)}
              className="px-8 py-4 bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-teal-400/30 flex items-center justify-center gap-3 mx-auto transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-teal-400/40 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
              aria-label="Start navigation"
            >
              🚀 Start Navigation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            <div className="text-center">
              <div className="text-xl mb-2">
                {useCurrentLocation ? "📍" : "🎯"}
              </div>
              <p className="m-0 text-xs text-yellow-700 font-medium uppercase tracking-wider">
                Starting from
              </p>
              <p className="mt-1 text-sm text-yellow-800 font-semibold">
                {useCurrentLocation ? "Current Location" : "Selected Location"}
              </p>
            </div>

            <div className="text-center">
              <div className="text-xl mb-2">⏱️</div>
              <p className="m-0 text-xs text-yellow-700 font-medium uppercase tracking-wider">
                Estimated Time
              </p>
              <p className="mt-1 text-lg text-yellow-800 font-bold">
                {estimatedTime !== null ? `${estimatedTime} min` : "Calculating..."}
              </p>
            </div>

            <div className="text-center">
              <div className="text-xl mb-2">🌬️</div>
              <p className="m-0 text-xs text-yellow-700 font-medium uppercase tracking-wider">
                Air Quality
              </p>
              <div className="mt-1">
                {aqi !== null ? (
                  <>
                    <div className={`inline-block text-white px-3 py-1 rounded-xl text-base font-bold mb-1 ${getAQIColor(aqi)}`}>
                      {aqi}
                    </div>
                    <p className={`m-0 text-xs font-semibold ${
                      aqi <= 50 ? 'text-teal-600' :
                      aqi <= 100 ? 'text-yellow-600' :
                      aqi <= 150 ? 'text-orange-600' :
                      aqi <= 200 ? 'text-red-600' :
                      aqi <= 300 ? 'text-purple-600' : 'text-red-700'
                    }`}>
                      {getAQILabel(aqi)}
                    </p>
                  </>
                ) : (
                  <p className="m-0 text-sm text-yellow-800 font-semibold">
                    Fetching...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationPage;