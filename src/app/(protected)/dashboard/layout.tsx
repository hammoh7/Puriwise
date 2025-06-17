"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchUserData } from "@/utils/userUtils";
import CompleteProfile from "../profile-complete/page";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const checkProfile = async () => {
      if (user) {
        try {
          const profile = await fetchUserData(user.uid);
          setProfileComplete(profile?.profileComplete ?? false);
        } catch (error) {
          console.error("Profile check failed:", error);
          setProfileComplete(false);
        }
      }
    };

    if (user) checkProfile();
  }, [user, loading, router]);

  if (loading || profileComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="min-h-screen">
        {user && <CompleteProfile />}
      </div>
    );
  }

  return children;
};

export default ProtectedLayout;
