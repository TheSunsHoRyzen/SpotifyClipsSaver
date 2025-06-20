import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import ensureValidAccessToken from "./spotify.js";
import { db } from "./firebase.js"; // Adjust the import path as necessary
import { v4 as uuidv4 } from "uuid";

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

    // Get all clips from Firestore
    const clipsRef = db.collection("users").doc(userId).collection("clips");
    const clipsSnapshot = await clipsRef.get();

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
    // console.log(trackUri);

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
    const userClipsRef = db.collection("users").doc(userId).collection("clips");
    const trackRef = db
      .collection("users")
      .doc(userId)
      .collection("clips")
      .doc(trackUri);
    const trackDoc = await trackRef.get();
    const id = uuidv4();

    if (trackDoc.exists) {
      // Update existing track's clips
      const data = trackDoc?.data();
      const startTimes = [...(data?.startTimes || []), start];
      const endTimes = [...(data?.endTimes || []), end];
      const ids = [...(data?.ids || []), id];

      await trackRef.update({ startTimes, endTimes, ids });
    } else {
      // Create new track document
      await trackRef.set({
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
//delete a clip from frontend
router.post("/deleteClip", ensureValidAccessToken, async (req, res) => {
  try {
    const { trackUri, start, end, id } = req.body;

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
    const trackRef = db
      .collection("users")
      .doc(userId)
      .collection("clips")
      .doc(trackUri);
    const trackDoc = await trackRef.get();

    if (trackDoc.exists) {
      // Update existing track's clips
      const data = trackDoc.data();
      let ids = data?.ids;
      const index = ids.indexOf(id);

      let startTimes = data?.startTimes;
      let endTimes = data?.endTimes;
      if (index != -1) {
        startTimes.splice(index, 1);
        endTimes.splice(index, 1);
        ids.splice(index, 1);
        // console.log("startTimes: " + startTimes);
        // console.log("endTimes: " + endTimes);
        // console.log("ids: " + ids);
        // Check if the arrays are empty
        // If they are, delete the document
        if (startTimes.length === 0) {
          await trackRef.delete();
          res.status(201).json({ success: true });
          return;
        } else {
          await trackRef.update({ startTimes, endTimes, ids });
        }
        // If they are not, update the document
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
//delete clip because it no longer exists
router.post("/deleteOldClip", ensureValidAccessToken, async (req, res) => {
  try {
    const { trackUri } = req.query;
    if (!trackUri) {
      res.status(400).json({ error: "Missing track URI" });
      return;
    }

    if (typeof trackUri !== "string") {
      res.status(400).json({ error: "Missing or invalid track URI" });
      return;
    }
    // Get user's Spotify ID
    const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    const userId = spotifyResponse.data.id;
    const trackRef = db
      .collection("users")
      .doc(userId)
      .collection("clips")
      .doc(trackUri);
    const trackDoc = await trackRef.get();
    // console.log(trackDoc);

    if (trackDoc.exists) {
      // Delete the track document
      await trackRef.delete();
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting clip in delete track", error);
    res.status(500).json({ error: "Failed to delete clip from deleted track" });
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
      const trackRef = db
        .collection("users")
        .doc(userId)
        .collection("clips")
        .doc(trackUri);
      const trackDoc = await trackRef.get();

      if (trackDoc.exists) {
        const data = trackDoc.data();
        // loop through documents and only return the clip with the correct start time, end time, and id
        res.json({
          startTimes: data?.startTimes || [],
          endTimes: data?.endTimes || [],
          ids: data?.ids || [],
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
