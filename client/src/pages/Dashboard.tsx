import React, { useEffect, useState } from "react";

interface UserProfile {
  display_name: string;
  email: string;
  images: { url: string }[];
  followers: { total: number };
  id: string;
}
function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Fetch the user's profile from Spotify
    fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/me`, {
      credentials: "include",
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error fetching user profile: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((profile) => {
        setUserProfile(profile);
        localStorage.setItem("user_id", profile.id); // Store user ID in localStorage
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {error && !userProfile && (
        <p>Loading... Please Login with Spotify before using this Website!</p>
      )}
      {userProfile && (
        <div className="flex flex-col justify-center items-center space-y-7">
          <h2>Welcome, {userProfile.display_name}!</h2>
          <img
            src={
              userProfile.images?.[0]?.url || "https://via.placeholder.com/150"
            }
            alt="Profile"
            width={150}
            height={150}
          />
          <p>Email: {userProfile.email}</p>
          <p>Followers: {userProfile.followers.total}</p>
          <p>ID: {userProfile.id}</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
