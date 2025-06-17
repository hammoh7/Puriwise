"use client";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/utils/userUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [age, setAge] = useState<number | "">("");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || age === "") return;

    setLoading(true);

    try {
      await updateProfile(user.uid, {
        age: Number(age),
        activityLevel,
        healthConditions,
        profileComplete: true,
      });

      // Use replace to force a complete navigation and re-evaluation
      router.replace(`/dashboard/${user.uid}`);

      // Force a page reload as a fallback
      window.location.href = `/dashboard/${user.uid}`;
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Profile update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    setHealthConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Complete Your Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) =>
                setAge(e.target.value ? parseInt(e.target.value) : "")
              }
              required
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
            <label className="block mb-2 font-medium">
              Health Conditions (select all that apply)
            </label>
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
            disabled={loading}
            className="w-full bg-accent text-black py-3 rounded-lg disabled:opacity-70"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
