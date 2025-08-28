// Track.tsx (drop-in replacement with looping clips)
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Song } from "../types/song";
import { usePlayer } from "../context/PlayerContext";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { PlayArrow, Add, Close, Delete } from "@mui/icons-material";

type TrackProps = {
  song: Song;
  deviceID: string | null;
  player: any;
  onClipEvent: () => void;
};

interface Clip {
  id: string;
  start: number;
  end: number;
}

function Track({ song, deviceID, player, onClipEvent }: TrackProps) {
  const { setCurrentSong, currentSong } = usePlayer();

  // keep fresh current song without functional set
  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const [showPopup, setShowPopup] = useState(false);
  const [startTime, setStartTime] = useState<string>("0:00");
  const [endTime, setEndTime] = useState<string>("0:00");
  const [isPlayingClip, setIsPlayingClip] = useState(false);

  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const activeClipRef = useRef<Clip | null>(null);
  useEffect(() => {
    activeClipRef.current = activeClip;
  }, [activeClip]);

  // interval id for looping
  const loopTimerRef = useRef<number | null>(null);
  const loopBusyRef = useRef(false);

  // Ensure clips object exists with default values
  const clips = song.clips || {
    startTimes: [],
    endTimes: [],
    ids: [],
  };

  const clearClipLoop = () => {
    if (loopTimerRef.current !== null) {
      window.clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    setIsPlayingClip(false);
    setActiveClip(null);
    activeClipRef.current = null;
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      clearClipLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play full song from beginning (NOT a clip)
  const handlePlay = useCallback(async () => {
    if (!deviceID) {
      console.error("No device ID available");
      return;
    }

    // stop any existing loop
    clearClipLoop();

    try {
      // poke player (optional)
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player`, {
        credentials: "include",
      });

      // transfer playback
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ device_ids: [deviceID], play: false }),
      });

      // small delay for device transfer
      await new Promise((resolve) => setTimeout(resolve, 500));

      // start playing from 0
      const playResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/spotify/player/play`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            device_id: deviceID,
            uris: [song.track.uri],
            position_ms: 0,
          }),
        }
      );

      if (!playResponse.ok) {
        try {
          const error = await playResponse.json();
          console.error("Play response error:", error);
        } catch {
          console.error("Non-JSON play error:", await playResponse.text());
        }
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }

      const next = {
        ...song.track,
        duration: song.track.duration_ms,
        position: 0,
        isPlaying: true,
        isClip: false,
        album: song.track.album,
      };
      setCurrentSong(next);
      currentSongRef.current = next;
    } catch (err) {
      console.error("Error in handlePlay:", err);
    }
  }, [deviceID, song.track, setCurrentSong]);

  const handleClosePopup = () => {
    setShowPopup(false);
    setStartTime("0:00");
    setEndTime("0:00");
  };

  const handleSaveClip = async () => {
    try {
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(":");
        if (parts.length === 2) {
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return parseInt(timeStr);
      };

      const parsedStartTime = parseTime(startTime);
      const parsedEndTime = parseTime(endTime);

      if (parsedStartTime >= parsedEndTime) {
        alert("Start time must be before end time");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/db/createClip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            trackUri: song.track.uri,
            start: parsedStartTime,
            end: parsedEndTime,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save clip");

      setShowPopup(false);
      setStartTime("0:00");
      setEndTime("0:00");
      onClipEvent();
      alert("Clip saved successfully!");
    } catch (error) {
      console.error("Error saving clip:", error);
      alert("Failed to save clip. Please try again.");
    }
  };

  const handleDeleteClip = async (start: number, end: number, id: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/db/deleteClip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            trackUri: song.track.uri,
            start,
            end,
            id,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete clip");

      onClipEvent();
      alert("Clip deleted successfully!");
    } catch (error) {
      console.error("Error deleting clip:", error);
      alert("Failed to delete clip. Please try again.");
    }
  };

  // Play a CLIP and LOOP it continuously until user stops/plays full song
  const playClip = useCallback(
    async (clip: Clip) => {
      if (!deviceID) return;

      try {
        // clear any existing loop before starting a new one
        clearClipLoop();

        // ensure playback on this device
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ device_ids: [deviceID], play: false }),
        });

        // tiny delay helps transfer settle
        await new Promise((resolve) => setTimeout(resolve, 150));

        // start playing from clip start
        await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/spotify/player/play`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              device_id: deviceID,
              uris: [song.track.uri],
              position_ms: clip.start * 1000,
            }),
          }
        );

        const nextPlay = {
          ...song.track,
          duration: song.track.duration_ms,
          position: clip.start * 1000,
          isPlaying: true,
          isClip: true,
          album: song.track.album,
        };
        setCurrentSong(nextPlay);
        currentSongRef.current = nextPlay;

        setActiveClip(clip);
        setIsPlayingClip(true);

        // set up looping: seek to start every (end-start) seconds while playing
        const clipMs = Math.max(0, (clip.end - clip.start) * 1000);

        loopTimerRef.current = window.setInterval(async () => {
          // avoid overlapping ticks
          if (loopBusyRef.current) return;
          loopBusyRef.current = true;

          try {
            const cs = currentSongRef.current;
            const ac = activeClipRef.current;

            // if clip context lost or user paused, skip this tick
            if (!cs || !ac || !cs.isPlaying) {
              loopBusyRef.current = false;
              return;
            }

            // re-seek to clip start (keeps playing)
            await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/spotify/player/seek`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  device_id: deviceID,
                  position_ms: ac.start * 1000,
                }),
              }
            );

            // update local position so UI snaps immediately
            const afterSeek = {
              ...cs,
              position: ac.start * 1000,
              isPlaying: true,
            };
            setCurrentSong(afterSeek);
            currentSongRef.current = afterSeek;
          } catch (e) {
            console.error("Clip loop seek error:", e);
          } finally {
            loopBusyRef.current = false;
          }
        }, clipMs);
      } catch (error) {
        console.error("Error playing clip:", error);
      }
    },
    [deviceID, song.track, setCurrentSong]
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {/* Album Art */}
          <Avatar
            src={
              song.track.album?.images?.[0]?.url ||
              "https://via.placeholder.com/60"
            }
            alt="Album"
            sx={{ width: 60, height: 60 }}
          />

          {/* Track Info */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {song.track.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {song.track.artists?.map((artist: any) => artist.name).join(", ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {song.track.album?.name}
            </Typography>
          </Box>

          {/* Play full song */}
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handlePlay}
            sx={{
              backgroundColor: "#1DB954",
              "&:hover": {
                backgroundColor: "#1ed760",
              },
            }}
          >
            Play
          </Button>
        </Box>

        {/* Clips Section */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="subtitle2">Clips:</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => setShowPopup(true)}
            >
              Add Clip
            </Button>
          </Box>

          {clips.startTimes &&
          clips.endTimes &&
          clips.startTimes.length === clips.endTimes.length &&
          clips.startTimes.length > 0 ? (
            <List dense>
              {clips.startTimes.map((start, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Chip
                        label={`${start}s - ${clips.endTimes[index]}s`}
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        playClip({
                          id: index.toString(),
                          start,
                          end: clips.endTimes[index],
                        })
                      }
                    >
                      {isPlayingClip &&
                      activeClip &&
                      activeClip.start === start &&
                      activeClip.end === clips.endTimes[index]
                        ? "Looping…"
                        : "Play Clip"}
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        // if deleting the active looping clip, stop loop first
                        if (
                          activeClip &&
                          activeClip.start === start &&
                          activeClip.end === clips.endTimes[index]
                        ) {
                          clearClipLoop();
                        }
                        handleDeleteClip(
                          start,
                          clips.endTimes[index],
                          clips.ids[index]
                        );
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No clips available
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Add Clip Dialog */}
      <Dialog
        open={showPopup}
        onClose={handleClosePopup}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Clip
          <IconButton
            aria-label="close"
            onClick={handleClosePopup}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Start Time"
              placeholder="mm:ss"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
            />
            <TextField
              label="End Time"
              placeholder="mm:ss"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup}>Cancel</Button>
          <Button onClick={handleSaveClip} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default Track;
