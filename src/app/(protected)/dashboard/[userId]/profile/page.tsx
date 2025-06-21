"use client";
import { useAuth } from "@/context/AuthContext";
import { fetchUserData, updateProfile } from "@/utils/userUtils";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Select from "react-select";

export default function ProfileEdit() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [healthInput, setHealthInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [pollutionSensitivity, setPollutionSensitivity] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user && params.userId === user.uid) {
        try {
          const data = await fetchUserData(user.uid);
          setProfile(data);
          setAge(data.age ?? "");
          setGender(data.gender || "");
          setHealthConditions(data.healthConditions || []);
          setActivityLevel(data.activityLevel || "");
          setPollutionSensitivity(data.pollutionSensitivity || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      await updateProfile(user.uid, {
        age: age ? Number(age) : undefined,
        gender,
        healthConditions,
        activityLevel,
        pollutionSensitivity,
      });
      router.push(`/dashboard/${user.uid}`);
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      borderLeft: state.isFocused ? "3px solid #ffd700" : "3px solid transparent",
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

  if (!user || params.userId !== user.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <div className="text-center p-8 bg-white/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-3-12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-800 mb-3 tracking-tight">
            Edit Your <span className="font-medium bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="text-lg text-gray-600 font-light">Customize your health and activity preferences</p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Age
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
                  onFocus={() => setFocusedField('age')}
                  onBlur={() => setFocusedField(null)}
                  min="1"
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 ${
                    focusedField === 'age' ? 'transform -translate-y-1 shadow-xl' : 'shadow-md'
                  }`}
                  placeholder="Enter your age"
                />
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                  focusedField === 'age' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Gender Identity
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  onFocus={() => setFocusedField('gender')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === 'gender' ? 'transform -translate-y-1 shadow-xl' : 'shadow-md'
                  }`}
                >
                  <option value="">Choose your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                  focusedField === 'gender' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Health Conditions
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
                  onFocus={() => setFocusedField('health')}
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
                Activity Level
              </label>
              <div className="relative">
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  onFocus={() => setFocusedField('activity')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === 'activity' ? 'transform -translate-y-1 shadow-xl' : 'shadow-md'
                  }`}
                >
                  <option value="">Choose your activity level</option>
                  <option value="Sedentary">🛋️ Sedentary - Little to no exercise</option>
                  <option value="Lightly Active">🚶 Lightly Active - Light exercise 1-3 days/week</option>
                  <option value="Moderately Active">🏃 Moderately Active - Moderate exercise 3-5 days/week</option>
                  <option value="Very Active">💪 Very Active - Hard exercise 6-7 days/week</option>
                  <option value="Extremely Active">🏋️ Extremely Active - Very hard exercise & physical job</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                  focusedField === 'activity' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-3 transition-all duration-200 group-focus-within:text-yellow-600">
                Pollution Sensitivity
              </label>
              <div className="relative">
                <select
                  value={pollutionSensitivity}
                  onChange={(e) => setPollutionSensitivity(e.target.value)}
                  onFocus={() => setFocusedField('pollution')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-14 px-6 bg-white/50 backdrop-blur-xl border-0 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-0 focus:bg-white/70 focus:shadow-lg focus:shadow-yellow-200/50 appearance-none cursor-pointer ${
                    focusedField === 'pollution' ? 'transform -translate-y-1 shadow-xl' : 'shadow-md'
                  }`}
                >
                  <option value="">Select your sensitivity level</option>
                  <option value="Low">🟢 Low Sensitivity</option>
                  <option value="Medium">🟡 Medium Sensitivity</option>
                  <option value="High">🔴 High Sensitivity</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300 ${
                  focusedField === 'pollution' ? 'w-full' : 'w-0'
                }`}></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 relative overflow-hidden h-14 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-medium rounded-xl transition-all duration-300 hover:from-yellow-500 hover:to-amber-600 hover:shadow-lg hover:shadow-yellow-200/50 focus:outline-none focus:ring-4 focus:ring-yellow-200/50 disabled:opacity-70 disabled:cursor-not-allowed group ${
                  submitting ? '' : 'hover:-translate-y-1'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/dashboard/${user.uid}`)}
                className="flex-1 h-14 bg-white/70 backdrop-blur-xl text-gray-700 font-medium rounded-xl border border-gray-200/50 transition-all duration-300 hover:bg-white/90 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-200/50 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your information is secure and will only be used to personalize your experience
          </p>
        </div>
      </div>
    </div>
  );
}