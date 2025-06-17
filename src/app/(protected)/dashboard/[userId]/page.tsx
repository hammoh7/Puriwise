"use client";
import HeaderBar from "@/components/dashboard/Headerbar";
import LocationModel from "@/components/dashboard/LocationModel";
import MapComponent from "@/components/dashboard/MapComponent";
import { useAuth } from "@/context/AuthContext";
import { fetchAQI } from "@/utils/aqiUtils";
import { fetchUserData, updateProfile } from "@/utils/userUtils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [aqi, setAqi] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await fetchUserData(user.uid);
          setUserProfile(profile);
          if (profile.currentLat && profile.currentLon) {
            setLat(profile.currentLat);
            setLon(profile.currentLon);
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        }
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    const fetchAQIForLocation = async () => {
      if (lat !== null && lon !== null) {
        try {
          console.log(`Fetching AQI for lat: ${lat}, lon: ${lon}`);
          const aqiValue = await fetchAQI(lat, lon);
          setAqi(aqiValue);
          if (aqiValue !== null && user) {
            const severity = getSeverity(aqiValue);
            await updateProfile(user.uid, {
              lastAQIReport: {
                location: userProfile?.currentLocation || "Unknown",
                aqi: aqiValue,
                severity,
              },
            });
          } else {
            console.warn("No AQI data available for this location");
          }
        } catch (error) {
          console.error("Failed to fetch AQI:", error);
        }
      }
    };
    fetchAQIForLocation();
  }, [lat, lon, user, userProfile]);

  const handleLocationSet = async (locationData: {
    location: string;
    lat: number;
    lon: number;
  }) => {
    if (user) {
      try {
        await updateProfile(user.uid, {
          currentLocation: locationData.location,
          currentLat: locationData.lat,
          currentLon: locationData.lon,
        });
        setLat(locationData.lat);
        setLon(locationData.lon);
        setUserProfile({
          ...userProfile,
          currentLocation: locationData.location,
          currentLat: locationData.lat,
          currentLon: locationData.lon,
        });
        setIsLocationModalOpen(false);
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    }
  };

  const getSeverity = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-green-600 bg-green-50 border-green-200";
    if (aqi <= 100) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (aqi <= 150) return "text-orange-600 bg-orange-50 border-orange-200";
    if (aqi <= 200) return "text-red-600 bg-red-50 border-red-200";
    if (aqi <= 300) return "text-purple-600 bg-purple-50 border-purple-200";
    return "text-rose-800 bg-rose-50 border-rose-200";
  };

  const navigateToAdvisor = () => {
    if (user?.uid) {
      router.push(`/dashboard/${user.uid}/advisor`);
    }
  };

  const navigateToCleanRoute = () => {
    if (user?.uid) {
      router.push(`/dashboard/${user.uid}/clean-route`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      <HeaderBar onLocationClick={() => setIsLocationModalOpen(true)} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor air quality and stay healthy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-6 h-full">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
              </div>

              {user && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Email Address
                    </label>
                    <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg">
                      {user.email}
                    </p>
                  </div>

                  {/* <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      User ID
                    </label>
                    <p className="text-gray-800 font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                      {user.uid}
                    </p>
                  </div> */}

                  {userProfile && (
                    <>
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Profile Status
                        </label>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              userProfile.profileComplete
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-2 ${
                                userProfile.profileComplete
                                  ? "bg-green-400"
                                  : "bg-yellow-400"
                              }`}
                            ></span>
                            {userProfile.profileComplete ? "Complete" : "Incomplete"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Current Location
                        </label>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-800 font-medium">
                            {userProfile.currentLocation || "Not set"}
                          </span>
                          <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                          >
                            📍 Change
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 overflow-hidden h-full">
              {lat !== null && lon !== null ? (
                <div className="relative h-full min-h-[400px]">
                  <MapComponent lat={lat} lon={lon} />
                  
                  <div className="absolute top-4 right-4 z-10">
                    {aqi !== null ? (
                      <div className={`p-4 rounded-xl shadow-lg border-2 backdrop-blur-sm ${getAQIColor(aqi)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg flex items-center">
                            <span className="mr-2">🌬️</span> Air Quality
                          </h3>
                          <button className="hover:scale-110 transition-transform">
                            🔄
                          </button>
                        </div>
                        
                        <div className="text-center mb-3">
                          <p className="text-3xl font-bold mb-1">{aqi}</p>
                          <p className="text-sm font-medium opacity-75">AQI Index</p>
                        </div>
                        
                        <div className="text-center mb-3">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-white/50">
                            {getSeverity(aqi)}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-medium text-sm mb-1">
                            📍 {userProfile?.currentLocation || "Unknown"}
                          </p>
                          <p className="text-xs opacity-75">
                            Updated: {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
                        <div className="text-center text-gray-600">
                          <span className="text-2xl mb-2 block">📡</span>
                          <p className="font-medium">Loading AQI data...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📍</span>
                    <p className="text-lg font-medium">Set your location to view map</p>
                    <button
                      onClick={() => setIsLocationModalOpen(true)}
                      className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Set Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            onClick={navigateToAdvisor}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-8 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🩺</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Health Advisor</h3>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Get personalized health recommendations based on current air quality conditions and your health profile.
            </p>
            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
              <span>Explore Health Tips</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          <div
            onClick={navigateToCleanRoute}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-8 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl">🛣️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Clean Air Route</h3>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Find the cleanest air quality routes for your daily commute and outdoor activities.
            </p>
            <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
              <span>Find Clean Routes</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>

      <LocationModel
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSet={handleLocationSet}
      />
    </div>
  );
};

export default DashboardPage;