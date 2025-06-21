"use client";
import { useAuth } from "@/context/AuthContext";
import { fetchUserData, updateProfile } from "@/utils/userUtils";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileEdit() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [age, setAge] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (user && params.userId === user.uid) {
        try {
          const data = await fetchUserData(user.uid);
          setProfile(data);
          setAge(data.age ?? null);
          setActivityLevel(data.activityLevel || "Moderate");
          setHealthConditions(data.healthConditions || []);
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, params.userId]);

  const toggleCondition = (condition: string) => {
    setHealthConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      await updateProfile(user.uid, {
        age: age ?? undefined,
        activityLevel,
        healthConditions,
      });
      router.push(`/dashboard/${user.uid}`);
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || params.userId !== user.uid) {
    return <div className="text-center p-4">Unauthorized access</div>;
  }

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center p-4">Profile not found</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Edit Your Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Age</label>
            <input
              type="number"
              value={age ?? ""}
              onChange={(e) =>
                setAge(e.target.value ? Number(e.target.value) : null)
              }
              min="1"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="Sedentary">Sedentary</option>
              <option value="Moderate">Moderate</option>
              <option value="Active">Active</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Health Conditions</label>
            <div className="space-y-2">
              {["Asthma", "Allergies", "Heart Condition", "None"].map(
                (condition) => (
                  <label
                    key={condition}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={healthConditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                      className="form-checkbox"
                    />
                    <span>{condition}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-black py-3 rounded-lg disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/${user.uid}`)}
            className="w-full bg-gray-200 text-black py-3 rounded-lg mt-2"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
