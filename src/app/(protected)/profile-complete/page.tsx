"use client";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/utils/userUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Select from "react-select";

export default function CompleteProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [healthInput, setHealthInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [pollutionSensitivity, setPollutionSensitivity] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      age === "" ||
      !gender ||
      !activityLevel ||
      !pollutionSensitivity
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      await updateProfile(user.uid, {
        age: Number(age),
        gender,
        healthConditions,
        activityLevel,
        pollutionSensitivity,
        profileComplete: true,
      });

      router.replace(`/dashboard/${user.uid}`);
      window.location.href = `/dashboard/${user.uid}`;
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Profile update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthSuggestions = (input: string) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }

    const commonConditions = [
      "Asthma",
      "Allergies",
      "Heart Condition",
      "Diabetes",
      "Hypertension",
      "Arthritis",
      "Chronic Obstructive Pulmonary Disease",
      "Migraine",
      "Depression",
      "Anxiety",
    ];

    const filtered = commonConditions.filter((condition) =>
      condition.toLowerCase().includes(input.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderRadius: "1rem",
      padding: "0.25rem",
      border: "none",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(20px)",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(255, 215, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.1)"
        : "0 4px 16px rgba(0, 0, 0, 0.1)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      minHeight: "3.5rem",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: "0.5rem 1rem",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "rgba(255, 215, 0, 0.15)",
      borderRadius: "0.5rem",
      border: "1px solid rgba(255, 215, 0, 0.3)",
      margin: "0.125rem",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      padding: "0.25rem 0.5rem",
      color: "#1a1a1a",
      fontWeight: "500",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "#ff6b6b",
      borderRadius: "0 0.5rem 0.5rem 0",
      "&:hover": {
        backgroundColor: "rgba(255, 107, 107, 0.2)",
        color: "#ff4757",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: "1rem",
      border: "none",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
      overflow: "hidden",
      marginTop: "0.5rem",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "rgba(255, 215, 0, 0.1)"
        : "transparent",
      color: "#1a1a1a",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      borderLeft: state.isFocused
        ? "3px solid #ffd700"
        : "3px solid transparent",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "rgba(26, 26, 26, 0.6)",
      fontWeight: "400",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "#1a1a1a",
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mb-6 shadow-lg relative">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-yellow-300/50 animate-ping"></div>
          </div>
          <h1 className="text-4xl font-light text-gray-800 mb-3 tracking-tight">
            Complete Your{" "}
            <span className="font-medium bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Profile
            </span>
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Tell us about yourself to get personalized recommendations
          </p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Age <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value ? parseInt(e.target.value) : "")
                  }
                  onFocus={() => setFocusedField("age")}
                  onBlur={() => setFocusedField(null)}
                  required
                  min="1"
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 ${
                    focusedField === "age"
                      ? "transform -translate-y-1 shadow-xl"
                      : "shadow-md"
                  }`}
                  placeholder="Enter your age"
                />
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                    focusedField === "age" ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Gender Identity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  onFocus={() => setFocusedField("gender")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === "gender"
                      ? "transform -translate-y-1 shadow-xl"
                      : "shadow-md"
                  }`}
                >
                  <option value="" disabled>
                    Choose your gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                    focusedField === "gender" ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Health Conditions{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Select
                  isMulti
                  options={suggestions.map((s) => ({ value: s, label: s }))}
                  value={healthConditions.map((c) => ({ value: c, label: c }))}
                  onInputChange={(input) => {
                    setHealthInput(input);
                    fetchHealthSuggestions(input);
                  }}
                  onFocus={() => setFocusedField("health")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(selected) =>
                    setHealthConditions(selected.map((s: any) => s.value))
                  }
                  placeholder="Type to search health conditions..."
                  styles={customStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable={false}
                  isSearchable
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Activity Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  onFocus={() => setFocusedField("activity")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === "activity"
                      ? "transform -translate-y-1 shadow-xl"
                      : "shadow-md"
                  }`}
                >
                  <option value="" disabled>
                    Choose your activity level
                  </option>
                  <option value="Sedentary">
                    🛋️ Sedentary - Little to no exercise
                  </option>
                  <option value="Lightly Active">
                    🚶 Lightly Active - Light exercise 1-3 days/week
                  </option>
                  <option value="Moderately Active">
                    🏃 Moderately Active - Moderate exercise 3-5 days/week
                  </option>
                  <option value="Very Active">
                    💪 Very Active - Hard exercise 6-7 days/week
                  </option>
                  <option value="Extremely Active">
                    🏋️ Extremely Active - Very hard exercise & physical job
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                    focusedField === "activity" ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Pollution Sensitivity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={pollutionSensitivity}
                  onChange={(e) => setPollutionSensitivity(e.target.value)}
                  onFocus={() => setFocusedField("pollution")}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === "pollution"
                      ? "transform -translate-y-1 shadow-xl"
                      : "shadow-md"
                  }`}
                >
                  <option value="" disabled>
                    Select your sensitivity level
                  </option>
                  <option value="Low">🟢 Low Sensitivity</option>
                  <option value="Medium">🟡 Medium Sensitivity</option>
                  <option value="High">🔴 High Sensitivity</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                    focusedField === "pollution" ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full relative overflow-hidden h-16 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold rounded-xl transition-all duration-300 hover:from-yellow-500 hover:to-amber-600 hover:shadow-lg hover:shadow-yellow-200/50 focus:outline-none focus:ring-4 focus:ring-yellow-200/50 disabled:opacity-70 disabled:cursor-not-allowed group ${
                  loading ? "" : "hover:-translate-y-1"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                      <span className="text-lg">Creating Your Profile...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg mr-3">Complete Profile</span>
                      <svg
                        className="w-6 h-6 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Your information is secure and encrypted
            </p>
          </div>
          <p className="text-xs text-gray-400">
            We use this data only to personalize your health recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
