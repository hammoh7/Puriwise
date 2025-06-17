"use client";
import HeaderBar from "@/components/dashboard/Headerbar";
import { useAuth } from "@/context/AuthContext";
import { fetchUserData } from "@/utils/userUtils";
import { useEffect, useState } from "react";

const DashboardPage = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await fetchUserData(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to load profile:", error);
        }
      }
    };

    loadProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <HeaderBar />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to Your Dashboard
        </h1>

        {user && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>UID:</strong> {user.uid}
            </p>
            {userProfile && (
              <>
                <p>
                  <strong>Profile Complete:</strong>{" "}
                  {userProfile.profileComplete ? "Yes" : "No"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
