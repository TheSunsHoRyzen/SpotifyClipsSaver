import React from "react";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Box } from "@mui/material";

const Navbar: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "grey.300" }}>
      <Toolbar>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            component={Link}
            to="/"
            sx={{
              color: "grey.800",
              "&:hover": {
                color: "grey.500",
                textDecoration: "underline",
              },
            }}
          >
            Home
          </Button>
          <Button
            component={Link}
            to="/dashboard"
            sx={{
              color: "grey.800",
              "&:hover": {
                color: "grey.500",
                textDecoration: "underline",
              },
            }}
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            to="/playlists"
            sx={{
              color: "grey.800",
              "&:hover": {
                color: "grey.500",
                textDecoration: "underline",
              },
            }}
          >
            Playlists
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
