"use client";
import { registerWithEmail } from "@/utils/authUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.uid}`);
    }
  }, [user, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await registerWithEmail(email, password);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        alert("Register failed: " + error.message);
      } else {
        alert("Register failed: An unknown error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
        <h2 className="text-3xl font-playfair font-semibold text-center mb-6 text-text">
          Create Your Account
        </h2>
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-primary-light text-text"
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: "var(--options)",
            }}
            className="w-full cursor-pointer  py-2 rounded-lg font-medium transition-colors"
          >
            Sign Up
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
