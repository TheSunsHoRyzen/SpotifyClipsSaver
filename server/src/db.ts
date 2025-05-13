import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import ensureValidAccessToken from "./spotify.js";
import { db } from "./firebase.js";
import { v4 as uuidv4 } from "uuid";
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

    const clips: Record<
      string,
      { startTimes: number[]; endTimes: number[]; ids: string[] }
    > = {};

    clipsSnapshot.forEach((doc) => {
      const data = doc.data();
      clips[doc.id] = {
        startTimes: data.startTimes || [],
        endTimes: data.endTimes || [],
        ids: data.ids || [],
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
    const id = uuidv4();

    if (trackDoc.exists()) {
      // Update existing track's clips
      const data = trackDoc.data();
      const startTimes = [...(data.startTimes || []), start];
      const endTimes = [...(data.endTimes || []), end];
      const ids = [...(data.ids || []), id];

      await updateDoc(trackRef, {
        startTimes,
        endTimes,
        ids,
      });
    } else {
      // Create new track document
      await setDoc(trackRef, {
        startTimes: [start],
        endTimes: [end],
        ids: [id],
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error creating clip:", error);
    res.status(500).json({ error: "Failed to create clip" });
  }
});
//delete a clip
router.post("/deleteClip", ensureValidAccessToken, async (req, res) => {
  try {
    const { trackUri, start, end, id } = req.body;
    console.log(trackUri);
    console.log(start);
    console.log(end);
    console.log(id);

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
      console.log(data);
      let ids = data.ids;
      console.log("IDs: " + ids);
      const index = ids.indexOf(id);
      console.log(index);
      let startTimes = data.startTimes;
      let endTimes = data.endTimes;
      if (index != -1) {
        startTimes.splice(index, 1);
        endTimes.splice(index, 1);
        ids.splice(index, 1);
        console.log("startTimes: " + startTimes);
        console.log("endTimes: " + endTimes);
        console.log("ids: " + ids);
        await updateDoc(trackRef, {
          startTimes,
          endTimes,
          ids,
        });
      } else {
        throw new Error("clip id not found in ids array");
      }
    } else {
      throw new Error("track document not found");
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error deleting clip:", error);
    res.status(500).json({ error: "Failed to create clip" });
  }
});

// Get clips for a specific track
router.get(
  "/getClips/:trackUri/:id",
  ensureValidAccessToken,
  async (req, res) => {
    try {
      const { trackUri, id } = req.params;

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
        // loop through documents and only return the clip with the correct start time, end time, and id
        res.json({
          startTimes: data.startTimes || [],
          endTimes: data.endTimes || [],
          ids: data.ids || [],
        });
      } else {
        res.json({
          startTimes: [],
          endTimes: [],
          ids: [],
        });
      }
    } catch (error) {
      console.error("Error fetching track clips:", error);
      res.status(500).json({ error: "Failed to fetch track clips" });
    }
  }
);

const dbRoutes = router;
export default dbRoutes;
