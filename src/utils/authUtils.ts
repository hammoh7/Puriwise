import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

function isFirebaseError(
  error: unknown
): error is { code: string; message: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

const createUserProfile = async (user: User) => {
  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Profile creation failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Profile creation error:", error);
    return null;
  }
};

// Registration
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createUserProfile(userCredential.user);
    return userCredential;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if (isFirebaseError(error)) {
      if (error.code === "auth/network-request-failed") {
        throw new Error("Network error. Please check your connection.");
      }
      throw new Error(error.message);
    }
    throw new Error("Unknown error during registration");
  }
};

// Login
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createUserProfile(userCredential.user);
    return userCredential;
  } catch (error: unknown) {
    console.error("Login error:", error);
    if (isFirebaseError(error)) {
      if (error.code === "auth/network-request-failed") {
        throw new Error("Network error. Please check your connection.");
      }
      throw new Error(error.message);
    }
    throw new Error("Unknown error during login");
  }
};
