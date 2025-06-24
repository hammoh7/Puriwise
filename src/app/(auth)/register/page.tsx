"use client";
import { registerWithEmail } from "@/utils/authUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.uid}`);
    }
  }, [user, router]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerWithEmail(email, password);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred during registration.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
        <h2 className="text-3xl font-playfair font-semibold text-center mb-6 text-text">
          Create Your Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); 
              }}
              required
              className="w-full px-4 py-2 border border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-primary-light text-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              className="w-full px-4 py-2 border border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-primary-light text-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
              className="w-full px-4 py-2 border border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-primary-light text-text"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: "var(--options)",
            }}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-text-light">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}