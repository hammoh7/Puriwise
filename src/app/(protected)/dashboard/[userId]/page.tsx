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
    if (aqi <= 50)
      return "text-emerald-700 bg-emerald-50/90 border-emerald-200/60";
    if (aqi <= 100) return "text-amber-700 bg-amber-50/90 border-amber-200/60";
    if (aqi <= 150)
      return "text-orange-700 bg-orange-50/90 border-orange-200/60";
    if (aqi <= 200) return "text-red-700 bg-red-50/90 border-red-200/60";
    if (aqi <= 300)
      return "text-violet-700 bg-violet-50/90 border-violet-200/60";
    return "text-rose-800 bg-rose-50/90 border-rose-200/60";
  };

  const navigateToAdvisor = () => {
    if (user?.uid) {
      router.push(`/dashboard/${user.uid}/advisor`);
    }
  };

  const navigateToCleanRoute = () => {
    if (user?.uid) {
      router.push(`/dashboard/${user.uid}/clean-finder`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(251,191,36,0.15),transparent)]"></div>
      </div>

      <div className="relative z-10">
        <HeaderBar onLocationClick={() => setIsLocationModalOpen(true)} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-light text-gray-800 mb-3 tracking-wide">
              Welcome to Your Dashboard
            </h1>
            <p className="text-gray-600 text-lg font-light">
              Monitor air quality and stay healthy
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-4"></div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 overflow-hidden h-full">
                {lat !== null && lon !== null ? (
                  <div className="relative h-full min-h-[400px]">
                    <MapComponent lat={lat} lon={lon} />

                    <div className="absolute top-4 right-4 z-10">
                      {aqi !== null ? (
                        <div
                          className={`p-4 rounded-xl shadow-lg border-2 backdrop-blur-sm ${getAQIColor(
                            aqi
                          )}`}
                        >
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
                            <p className="text-sm font-medium opacity-75">
                              AQI Index
                            </p>
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
                      <p className="text-lg font-medium">
                        Set your location to view map
                      </p>
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

            <div className="lg:col-span-2 space-y-6">
              <article
                onClick={navigateToAdvisor}
                className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-6 cursor-pointer hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white text-xl">🩺</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-gray-800 tracking-wide mb-1">
                      Health Advisor
                    </h3>
                    <div className="w-8 h-px bg-gradient-to-r from-blue-400 to-transparent"></div>
                  </div>
                </div>
                <p className="text-gray-600 font-light leading-relaxed mb-4 text-sm">
                  Get personalized health recommendations based on current air
                  quality conditions and your health profile.
                </p>
                <div className="flex items-center text-blue-600 font-light group-hover:text-blue-700 transition-colors text-sm">
                  <span className="tracking-wide">Explore Health Tips</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </div>
              </article>

              <article
                onClick={navigateToCleanRoute}
                className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-6 cursor-pointer hover:shadow-xl hover:bg-white/80 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-white text-xl">🛣️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-gray-800 tracking-wide mb-1">
                      Clean Air Route
                    </h3>
                    <div className="w-8 h-px bg-gradient-to-r from-green-400 to-transparent"></div>
                  </div>
                </div>
                <p className="text-gray-600 font-light leading-relaxed mb-4 text-sm">
                  Find the cleanest air quality routes for your daily commute
                  and outdoor activities.
                </p>
                <div className="flex items-center text-green-600 font-light group-hover:text-green-700 transition-colors text-sm">
                  <span className="tracking-wide">Find Clean Routes</span>
                  <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </div>
              </article>
            </div>
          </div>
        </main>
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
