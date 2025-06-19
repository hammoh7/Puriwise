"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { googleMapsLoader } from "@/utils/googleLoader";
import { getLocationFromCoords } from "@/utils/geoCodeUtils";

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
}

const CleanAirFinder = () => {
  const { user } = useAuth();
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
          }
        },
        (error) => {
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
      const response = await fetch(
        `/api/cleanroute?startLat=${start.lat}&startLng=${start.lng}&endLat=${end.lat}&endLng=${end.lng}&userId=${userProfileId}`
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
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 5,
        zIndex: 10,
        map: map,
      });

      const cleanestPath = new google.maps.Polyline({
        path: decodePolyline(data.cleanest.polyline),
        strokeColor: "#00FF00",
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
    }
  };

  const navigateRoute = (typeOrRoute: "fastest" | "cleanest" | SavedRoute) => {
    let originLat: number, originLng: number, destLat: number, destLng: number;

    if (typeof typeOrRoute === "string") {
      if (!routes || !start || !end) return;
      originLat = start.lat;
      originLng = start.lng;
      destLat = end.lat;
      destLng = end.lng;
    } else {
      originLat = typeOrRoute.start.coordinates[1];
      originLng = typeOrRoute.start.coordinates[0]; 
      destLat = typeOrRoute.end.coordinates[1];
      destLng = typeOrRoute.end.coordinates[0]; 
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=walking`;
    window.open(url, "_blank");
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
      strokeColor: route.routeType === "fastest" ? "#0000FF" : "#00FF00",
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
    <div style={{ padding: "20px" }}>
      <h1>Clean-Air Route Finder</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div
        style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}
      >
        <input
          ref={startInputRef}
          type="text"
          placeholder="Start location"
          style={{ marginRight: "10px", padding: "5px", flex: 1 }}
        />
        <button
          onClick={handleCurrentLocation}
          style={{
            padding: "5px 10px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Current Location
        </button>
        <input
          ref={endInputRef}
          type="text"
          placeholder="End location"
          style={{
            marginLeft: "10px",
            marginRight: "10px",
            padding: "5px",
            flex: 1,
          }}
        />
        <button
          onClick={fetchRoutes}
          disabled={!start || !end || !userProfileId}
          style={{
            padding: "5px 10px",
            background: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !start || !end || !userProfileId ? "not-allowed" : "pointer",
          }}
        >
          Find Routes
        </button>
      </div>
      <div
        ref={mapRef}
        style={{ height: "400px", width: "100%", marginBottom: "20px" }}
      />
      {routes && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2>Fastest Route (Blue)</h2>
            <p>Distance: {(routes.fastest.distance / 1000).toFixed(2)} km</p>
            <p>Time: {Math.round(routes.fastest.time / 60)} minutes</p>
            <p>Exposure Score: {routes.fastest.exposure.toFixed(2)}</p>
            <button onClick={() => navigateRoute("fastest")}>Navigate</button>
            <button
              onClick={() => saveRoute("fastest")}
              style={{ marginLeft: "10px" }}
            >
              Save
            </button>
          </div>
          <div>
            <h2>Cleanest Route (Green)</h2>
            <p>Distance: {(routes.cleanest.distance / 1000).toFixed(2)} km</p>
            <p>Time: {Math.round(routes.cleanest.time / 60)} minutes</p>
            <p>Exposure Score: {routes.cleanest.exposure.toFixed(2)}</p>
            <button onClick={() => navigateRoute("cleanest")}>Navigate</button>
            <button
              onClick={() => saveRoute("cleanest")}
              style={{ marginLeft: "10px" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
      <div style={{ marginTop: "20px" }}>
        <h2>Saved Routes</h2>
        {savedRoutes.length === 0 ? (
          <p>No saved routes found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {savedRoutes.map((route) => (
              <li
                key={route.id}
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  marginBottom: "10px",
                  cursor: "pointer",
                }}
                onClick={() => displaySavedRoute(route)}
              >
                <h3>{route.name || "Unnamed Route"}</h3>
                <p>Type: {route.routeType}</p>
                <p>Distance: {(route.distance / 1000).toFixed(2)} km</p>
                <p>Time: {Math.round(route.time / 60)} minutes</p>
                <p>Exposure Score: {route.exposure.toFixed(2)}</p>
                <p>
                  Start:{" "}
                  {route.startName ||
                    `${route.start.coordinates[1]}, ${route.start.coordinates[0]}`}
                </p>
                <p>
                  End:{" "}
                  {route.endName ||
                    `${route.end.coordinates[1]}, ${route.end.coordinates[0]}`}
                </p>
                <p>Saved: {new Date(route.createdAt).toLocaleString()}</p>
                <div style={{ marginTop: "10px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateRoute(route);
                    }}
                    style={{
                      background: "#007BFF",
                      color: "white",
                      padding: "5px 10px",
                      marginRight: "10px",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Navigate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoute(route.id);
                    }}
                    style={{
                      background: "red",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CleanAirFinder;
