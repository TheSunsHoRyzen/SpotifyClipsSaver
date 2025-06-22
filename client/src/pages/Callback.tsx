import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (!code) {
      console.error("Missing code parameter!");
      return;
    }
    fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/callback`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token exchange failed");
        return res.json();
      })
      .then(() => {
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Error during callback", err);
      });
  }, [navigate]);
  return <p className="text-center">Logging you in with Spotify...</p>;
}
