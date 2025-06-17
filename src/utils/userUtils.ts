export const fetchUserData = async (userId: string) => {
  try {
    const response = await fetch(`/api/user/${userId}`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user data");
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      uid: userId,
      profileComplete: false,
      email: "",
      healthConditions: [],
      savedCities: [],
    };
  }
};

export const updateProfile = async (userId: string, data: any) => {
  try {
    const response = await fetch(`/api/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
};
