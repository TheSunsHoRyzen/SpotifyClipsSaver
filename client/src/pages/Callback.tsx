import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { checkToken } from "../checkToken";



interface UserProfile {
  display_name: string;
  email: string;
  images: { url: string }[];
  followers: { total: number };
}

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // Exchange the authorization code for an access token
      fetch("http://localhost:8080/auth/spotify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.access_token) {
            // setAccessToken(data.access_token);
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("expires_in", data.expires_in);
            localStorage.setItem("refresh_token", data.refresh_token);
          } else {
            throw new Error("No access token received");
          }
          if (data.expires_in) {
            let date = Date.now();
            date = Math.floor(date / 1000);
            date += data.expires_in;
            // setAccessToken(data.access_token);
            localStorage.setItem("date", String(date));
          } else {
            throw new Error("No expiration length received");
          }
          if (data.refresh_token) {
            // setAccessToken(data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
          } else {
            throw new Error("No refresh token received");
          }
        })
        .catch((err) => setError(err.message));
    } else {
      setError("No authorization code found");
    }
  }, [searchParams]);

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      // Fetch the user's profile from Spotify
      const fetchToken = async () => {
        const accesstoken = await checkToken();
        if (accesstoken) {
          console.log("access token received!");
        }
      };
      fetchToken();
      fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error fetching user profile: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((profile) => setUserProfile(profile))
        .catch((err) => setError(err.message));
    }
  }, []);

  return (
    <div>
      {/* {error && <p>{error}</p>} */}
      {!error && !userProfile && <p>Loading...</p>}
      {userProfile && (
        <div>
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
        </div>
      )}
    </div>
  );
};

export default Callback;
