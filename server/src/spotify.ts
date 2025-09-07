import express from "express";
import axios from "axios";
import dotenv from "dotenv";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
console.log(envFile);
dotenv.config({ path: ".env.development" });

const router = express.Router();

async function refreshAccessToken(req: any): Promise<void> {
  const refreshToken = req.session.refreshToken;
  if (!refreshToken) throw new Error("No refresh token");

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, expires_in } = response.data;

  req.session.accessToken = access_token;
  req.session.expiresAt = Date.now() + expires_in * 1000;

  console.log("🔁 Refreshed access token");
}

// Middleware to check and refresh token
async function ensureValidAccessToken(req: any, res: any, next: any) {
  const { accessToken, refreshToken, expiresAt } = req.session;

  const isExpired = !accessToken || Date.now() >= expiresAt;

  if (isExpired && refreshToken) {
    try {
      await refreshAccessToken(req);
      next();
    } catch (err) {
      console.error("Failed to refresh token", err);
      return res.status(401).json({ error: "Token refresh failed" });
    }
  } else {
    next();
  }
}

// Protected route using the valid token
router.get("/me", ensureValidAccessToken, async (req, res) => {
  try {
    // console.log("Session contents:", req.session);
    console.log("Reading session ID:", req.sessionID);
    if (!req.session.accessToken) {
      res.status(401).json({ error: "No access token in session" });
    }
    const { data } = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    res.json(data);
  } catch (err) {
    console.error("Error fetching from /spotify/me: ", err);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

router.get("/v1/me/playlists/", ensureValidAccessToken, async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.spotify.com/v1/me/playlists/",
      {
        headers: {
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user playlists" });
  }
});

// Debug route to check session status
router.get("/debug-session", (req, res) => {
  console.log("Debug session route - Session data:", req.session);
  console.log("Session ID:", req.sessionID);
  console.log("Refresh token in session:", req.session.refreshToken);
  console.log("Access token in session:", req.session.accessToken);

  res.json({
    sessionExists: !!req.session,
    sessionID: req.sessionID,
    hasRefreshToken: !!req.session.refreshToken,
    hasAccessToken: !!req.session.accessToken,
    sessionData: req.session,
  });
});

// Route to fetch tracks from a specific playlist
router.get(
  "/playlist/:playlistId/tracks",
  ensureValidAccessToken,
  async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { offset = 0, limit = 20 } = req.query;

      const { data } = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${req.session.accessToken}`,
          },
        }
      );
      res.json(data);
    } catch (err) {
      console.error("Error fetching playlist tracks:", err);
      res.status(500).json({ error: "Failed to fetch playlist tracks" });
    }
  }
);

// Route to get access token for Spotify player
router.get("/player-token", ensureValidAccessToken, async (req, res) => {
  try {
    res.json({ access_token: req.session.accessToken });
  } catch (err) {
    console.error("Error providing player token:", err);
    res.status(500).json({ error: "Failed to provide player token" });
  }
});

// Route to get current player state
router.get("/player", ensureValidAccessToken, async (req, res) => {
  try {
    // console.log(req.session.accessToken);
    const { data } = await axios.get("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });
    res.json(data);
  } catch (err) {
    // Spotify returns 204 when no active device
    if (axios.isAxiosError(err) && err.response?.status === 204) {
      res.status(204).send();
    } else {
      console.error("Error fetching player state:", err);
      res.status(500).json({ error: "Failed to fetch player state" });
    }
  }
});

// Route to transfer playback to a device
router.put("/player", ensureValidAccessToken, async (req, res) => {
  try {
    const { device_ids, play } = req.body;

    const { data } = await axios.put(
      "https://api.spotify.com/v1/me/player",
      { device_ids, play },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    res.json(data);
  } catch (err) {
    console.error("Error transferring playback:", err);
    res.status(500).json({ error: "Failed to transfer playback" });
  }
});

// Route to play a track
router.put("/player/play", ensureValidAccessToken, async (req, res) => {
  try {
    const { device_id, uris, position_ms } = req.body;

    const { data } = await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${device_id}`,
      { uris, position_ms },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    res.json(data);
  } catch (err) {
    console.error("Error playing track:", err);
    res.status(500).json({ error: "Failed to play track" });
  }
});
// Route to seek within the current track
router.put("/player/seek", ensureValidAccessToken, async (req, res) => {
  try {
    // Accept body or query (body is what your frontend uses)
    let { device_id, position_ms } = req.body || {};
    if (position_ms == null) position_ms = req.query.position_ms;
    if (device_id == null) device_id = req.query.device_id;

    const posNum = Number(position_ms);
    if (!Number.isFinite(posNum) || posNum < 0) {
      res
        .status(400)
        .json({ error: "position_ms must be a non-negative number" });
    }

    // Build Spotify seek URL: PUT /v1/me/player/seek?position_ms=...&device_id=...
    const url = new URL("https://api.spotify.com/v1/me/player/seek");
    url.searchParams.set("position_ms", String(Math.floor(posNum)));
    if (device_id) url.searchParams.set("device_id", String(device_id));

    // Spotify expects no body; 204 No Content on success
    await axios.put(url.toString(), null, {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    // Normalize success to 204 to mirror Spotify behavior
    res.status(204).send();
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      // Pass through Spotify status when possible for easier debugging
      res
        .status(err.response.status)
        .json({ error: "Seek failed", details: err.response.data });
    }
    console.error("Error seeking:", err);
    res.status(500).json({ error: "Failed to seek" });
  }
});

// Route to pause playback
router.put("/player/pause", ensureValidAccessToken, async (req, res) => {
  try {
    const { device_id } = req.query;

    const { data } = await axios.put(
      `https://api.spotify.com/v1/me/player/pause?device_id=${device_id}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.session.accessToken}`,
        },
      }
    );

    res.json(data);
  } catch (err) {
    console.error("Error pausing playback:", err);
    res.status(500).json({ error: "Failed to pause playback" });
  }
});

export default router;
