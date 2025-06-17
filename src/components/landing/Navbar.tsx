"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/utils/firebaseConfig";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  return (
    <nav className="sticky top-0 z-50 bg-primary/90 backdrop-blur-sm py-4 border-b border-primary-dark">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-xl font-playfair font-semibold text-text">
            Puriwise
          </span>
        </Link>

        <div className="hidden md:flex space-x-8">
          <Link
            href="#features"
            className="font-medium hover:text-accent transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="font-medium hover:text-accent transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#testimonials"
            className="font-medium hover:text-accent transition-colors"
          >
            Testimonials
          </Link>
        </div>

        {user ? (
          <div className="relative">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                <Link
                  href={`/dashboard/${user.uid}`}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    try {
                      signOut(auth);
                      router.push("/");
                    } catch (error) {
                      console.error("Error signing out: ", error);
                    }
                  }}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="bg-white cursor-pointer hover:bg-accent-dark text-accent py-2 px-6 rounded-full font-medium transition-colors shadow-md hover:shadow-lg">
              Get Started
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
