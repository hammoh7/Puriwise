"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/utils/firebaseConfig";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaUser, FaTachometerAlt } from "react-icons/fa";

const Navbar = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const renderUserAvatar = () => {
    if (user?.photoURL && !imageError) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all duration-200"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div
        className="w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all duration-200 hover:scale-105"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {user?.email ? (
          <span className="text-white font-bold text-sm">
            {getUserInitials(user.email)}
          </span>
        ) : (
          <FaUser className="text-white text-sm" />
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-yellow-50/95 via-amber-50/95 to-orange-50/95 backdrop-blur-md py-4 border-b border-yellow-200/50 shadow-sm">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent group-hover:from-amber-600 group-hover:to-yellow-600 transition-all duration-200">
              Puriwise
            </span>
          </div>
        </Link>

        <div className="hidden md:flex space-x-8">
          <Link
            href="#features"
            className="font-medium text-gray-700 hover:text-amber-600 transition-colors duration-200 relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link
            href="#how-it-works"
            className="font-medium text-gray-700 hover:text-amber-600 transition-colors duration-200 relative group"
          >
            How It Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button
            className="md:hidden p-2 text-gray-700 hover:text-amber-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {user ? (
            <div className="relative">
              {renderUserAvatar()}

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md shadow-xl rounded-2xl border border-yellow-200/50 z-20 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                          {user?.photoURL && !imageError ? (
                            <img
                              src={user.photoURL}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          ) : user?.email ? (
                            <span className="text-white font-bold text-xs">
                              {getUserInitials(user.email)}
                            </span>
                          ) : (
                            <FaUser className="text-white text-xs" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {user?.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href={`/dashboard/${user.uid}`}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-amber-600 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FaTachometerAlt className="mr-3 text-gray-400" />
                        Dashboard
                      </Link>

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="mr-3 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-2.5 px-6 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105">
                Get Started
              </button>
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-yellow-200/50 bg-white/95 backdrop-blur-sm">
          <div className="px-6 py-4 space-y-4">
            <Link
              href="#features"
              className="block font-medium text-gray-700 hover:text-amber-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block font-medium text-gray-700 hover:text-amber-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
