import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import ensureValidAccessToken from "./spotify.js";
import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

dotenv.config();

const router = express.Router();

// Get all clips for a user
router.get("/getClips", ensureValidAccessToken, async (req, res) => {
  try {
    // Get user's Spotify ID
    const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    const userId = spotifyResponse.data.id;

    // Get clips from Firestore
    const clipsRef = collection(db, "users", userId, "clips");
    const clipsSnapshot = await getDocs(clipsRef);

    const clips: Record<string, { startTimes: number[]; endTimes: number[] }> =
      {};

    clipsSnapshot.forEach((doc) => {
      const data = doc.data();
      clips[doc.id] = {
        startTimes: data.startTimes || [],
        endTimes: data.endTimes || [],
      };
    });

    res.json(clips);
  } catch (error) {
    console.error("Error fetching clips:", error);
    res.status(500).json({ error: "Failed to fetch clips" });
  }
});

// Create a new clip
router.post("/createClip", ensureValidAccessToken, async (req, res) => {
  try {
    const { trackUri, start, end } = req.body;
    console.log(trackUri);

    if (!trackUri || start === undefined || end === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Get user's Spotify ID
    const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    const userId = spotifyResponse.data.id;

    // Get the track document reference
    const trackRef = doc(db, "users", userId, "clips", trackUri);
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      // Update existing track's clips
      const data = trackDoc.data();
      const startTimes = [...(data.startTimes || []), start];
      const endTimes = [...(data.endTimes || []), end];

      await updateDoc(trackRef, {
        startTimes,
        endTimes,
      });
    } else {
      // Create new track document
      await setDoc(trackRef, {
        startTimes: [start],
        endTimes: [end],
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error creating clip:", error);
    res.status(500).json({ error: "Failed to create clip" });
  }
});

// Get clips for a specific track
router.get("/getClips/:trackUri", ensureValidAccessToken, async (req, res) => {
  try {
    const { trackUri } = req.params;

    // Get user's Spotify ID
    const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    const userId = spotifyResponse.data.id;

    // Get the track document
    const trackRef = doc(db, "users", userId, "clips", trackUri);
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      const data = trackDoc.data();
      res.json({
        startTimes: data.startTimes || [],
        endTimes: data.endTimes || [],
      });
    } else {
      res.json({
        startTimes: [],
        endTimes: [],
      });
    }
  } catch (error) {
    console.error("Error fetching track clips:", error);
    res.status(500).json({ error: "Failed to fetch track clips" });
  }
});

const dbRoutes = router;
export default dbRoutes;
