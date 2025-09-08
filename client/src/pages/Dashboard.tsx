import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Avatar,
  Box,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";

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
  const [loading, setLoading] = useState(true);

  // console.log("NODE_ENV:", process.env.NODE_ENV);

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
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ minHeight: "100vh", py: 4 }}>
      {error && !userProfile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading... Please Login with Spotify before using this Website!
          {error}
        </Alert>
      )}
      {userProfile && (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography variant="h4" component="h2" gutterBottom>
              Welcome, {userProfile.display_name}!
            </Typography>
            <Avatar
              src={
                userProfile.images?.[0]?.url ||
                "https://via.placeholder.com/150"
              }
              alt="Profile"
              sx={{ width: 150, height: 150 }}
            />
            <Box sx={{ textAlign: "center", width: "100%" }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Email: {userProfile.email}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Followers: {userProfile.followers.total}
              </Typography>
              <Typography variant="body1">ID: {userProfile.id}</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default Dashboard;
