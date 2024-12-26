import { Request, Response } from "express"; // Import types from express
import {
  getAuthorizationUrl,
  exchangeToken,
  refreshToken,
} from "../services/spotifyService.js";

// Handle the /spotify-auth-url route to return the authorization URL
export const getAuthUrl = (req: Request, res: Response): void => {
  // Add types for req and res
  const authUrl = getAuthorizationUrl();
  res.json({ url: authUrl });
};

// Handle the /spotify-token route to exchange the authorization code for tokens
export const exchangeAuthCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Add types for req and res
  console.log("In exchange Auth Code!");

  const { code } = req.body; // Get code from body
  // const { state } = req.body.state;
  if (!code) {
    console.log("no auth code provided");
    res.status(400).json({ error: "Authorization code is required" });
  }
  // if (!state) {
  //   console.log("no state provided!");
  //   res.status(400).json({ error: "state should be here" });
  // }
  try {
    const tokens = await exchangeToken(code); // Exchange the code for tokens
    res.json(tokens);
  } catch (error) {
    console.log("Error exchanging authorization code:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Optionally, keep your login and callback methods as well if they are being used.
export const login = (req: Request, res: Response): void => {
  // Add types for req and res
  try {
    const authUrl = getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.log("Error generating Spotify Authorization URL:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const callback = async (req: Request, res: Response): Promise<void> => {
  // Add types for req and res
  const code = req.query.code;
  // const state = req.query.state;
  if (!code) {
    res.status(400).json({ error: "Authorization code is missing" });
    return;
  }
  try {
    const data = await exchangeToken(code as string); // Type assertion for `code`
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Authentication failed", details: error });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    console.log("no refresh token provided!");
    res.status(400).json({ error: "refresh token is required!" });
    return;
  }
  try {
    const tokens = await refreshToken(refresh_token); // Pass the extracted token
    res.json(tokens); // Send tokens back to the client
  } catch (error) {
    console.log("Error acquiring refresh token:", error);
    res.status(500).json({ error: "Refresh failed" });
  }
};
