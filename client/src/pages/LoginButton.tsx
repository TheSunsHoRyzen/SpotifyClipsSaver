import React from "react";
import { Button, Container, Typography, Box, Paper } from "@mui/material";

const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/login`;
  };

  return (
    <Container sx={{ minHeight: "100vh", py: 4 }}>
      {/* Header at the top */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Spotify Clip Saver
        </Typography>
      </Box>

      {/* Centered Content */}
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            sx={{
              backgroundColor: "#1DB954",
              "&:hover": {
                backgroundColor: "#1ed760",
              },
              px: 4,
              py: 1.5,
            }}
          >
            Login with Spotify
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Welcome to Spotify Clip Saver! You must have a Spotify Premium
              Account and you must Login with Spotify before using this webapp.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              After you sign in, you will be brought back to this page and will
              be able to use any part of the web app.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              User interface overhaul coming soon!
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginButton;
