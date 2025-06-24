"use client";
import { useAuth } from "@/context/AuthContext";
import { loginWithEmail } from "@/utils/authUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.uid}`);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); 

    try {
      await loginWithEmail(email, password);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
        <h2 className="text-3xl font-playfair font-semibold text-center mb-6 text-text">
          Welcome Back
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-text-light">
          Don't have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
