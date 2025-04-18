import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
            setAccessToken(data.access_token);
            localStorage.setItem("access_token", data.access_token);
          } else {
            throw new Error("No access token received");
          }
          if (data.expires_in) {
            // console.log(data.expires_in + " EXPIRES");
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

  return (
    <div>
      {!accessToken && (
        <div>
          <h2>Please Login with Spotify before using this App!</h2>
          <h2>{error}</h2>
        </div>
      )}
      {accessToken && (
        <div>
          <h2>
            Access token created! You may now use any function of the website.
          </h2>
        </div>
      )}
    </div>
  );
};

export default Callback;
