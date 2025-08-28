import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      setError(`Spotify authorization error: ${error}`);
      setLoading(false);
      return;
    }

    if (!code) {
      setError("Missing authorization code from Spotify");
      setLoading(false);
      return;
    }

    // console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/auth/callback`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific invalid_grant error
        if (errorData.code === "INVALID_GRANT") {
          setError("Authorization expired. Please try logging in again.");
          setLoading(false);
          return;
        }

        throw new Error(
          errorData.details || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error during callback", err);
      setError(`Authentication failed: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
    // Redirect back to login to get a fresh authorization code
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/login`;
  };

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Failed
          </Typography>
          <Typography variant="body1">{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This usually happens when the authorization code expires or is used
            multiple times.
          </Typography>
        </Alert>
        <Button variant="contained" onClick={handleRetry} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="h6">Logging you in with Spotify...</Typography>
    </Box>
  );
}
