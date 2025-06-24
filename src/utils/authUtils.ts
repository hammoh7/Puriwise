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

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled. Please contact support.";
    case "auth/invalid-login-credentials":
      return "Invalid login credentials. Please check your email and password.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/missing-email":
      return "Please enter an email address.";
    case "auth/invalid-password":
      return "Invalid password format.";
    case "auth/requires-recent-login":
      return "Please log out and log back in to complete this action.";
    default:
      return "An error occurred during authentication. Please try again.";
  }
};

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
      throw new Error(getAuthErrorMessage(error.code));
    }
    throw new Error("An unexpected error occurred during registration.");
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
      throw new Error(getAuthErrorMessage(error.code));
    }
    throw new Error("An unexpected error occurred during login.");
  }
};
