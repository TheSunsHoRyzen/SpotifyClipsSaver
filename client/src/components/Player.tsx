import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Typography, Slider, Paper } from "@mui/material";
import { PlayArrow, Pause, Replay } from "@mui/icons-material";
import { usePlayer } from "../context/PlayerContext";

interface PlayerProps {
  deviceID: string | null;
}

function Player({ deviceID }: PlayerProps) {
  const { currentSong, setCurrentSong } = usePlayer();
  const [isRepeat, setIsRepeat] = useState(false);

  // Keep a ref with the latest currentSong so we can build next objects
  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // Add play/pause handler
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handlePlayPause();
  };

  const handlePlayPause = async () => {
    const cs = currentSongRef.current;
    if (!cs) return;

    try {
      const endpoint = cs.isPlaying ? "pause" : "play";

      if (endpoint === "pause") {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/spotify/player/pause?device_id=${deviceID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (response.ok || response.status === 204) {
          const next = { ...cs, isPlaying: false };
          setCurrentSong(next);
          currentSongRef.current = next;
        } else {
          const errorData = await response.text();
          console.error("Failed to pause playback:", errorData);
        }
      } else {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/spotify/player/play`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              device_id: deviceID,
              uris: [cs.uri],
              position_ms: cs.position,
            }),
          }
        );

        if (response.ok || response.status === 204) {
          const next = { ...cs, isPlaying: true, position: cs.position };
          setCurrentSong(next);
          currentSongRef.current = next;
        } else {
          const errorData = await response.text();
          console.error("Failed to play playback:", errorData);
        }
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  // Polling: use ref, do not invert is_playing, and avoid functional set
  useEffect(() => {
    if (!currentSong) return;

    const trackKey = currentSong.uri; // run this effect per-track
    let errorCount = 0;
    const maxErrors = 3;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/spotify/player`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          errorCount = 0;

          if (data && data.item) {
            const prev = currentSongRef.current;
            if (!prev) return;

            const next = {
              ...prev,
              isPlaying: Boolean(data.is_playing), // <- no inversion
              position:
                typeof data.progress_ms === "number"
                  ? data.progress_ms
                  : prev.position,
              album: data.item.album ?? prev.album,
            };

            setCurrentSong(next);
            currentSongRef.current = next;
          }
        } else {
          if (++errorCount >= maxErrors) clearInterval(interval);
        }
      } catch (e) {
        if (++errorCount >= maxErrors) clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong?.uri, setCurrentSong]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    const cs = currentSongRef.current;
    if (!cs || !deviceID) return;

    const position = Array.isArray(newValue) ? newValue[0] : newValue;

    fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player/seek`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        device_id: deviceID,
        position_ms: position,
      }),
    })
      .then((response) => {
        if (response.ok) {
          const next = { ...cs, position };
          setCurrentSong(next);
          currentSongRef.current = next;
        }
      })
      .catch((error) => {
        console.error("Error seeking:", error);
      });
  };

  if (!currentSong) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Album Art */}
        <Box
          sx={{ width: 60, height: 60, borderRadius: 1, overflow: "hidden" }}
        >
          <img
            src={
              currentSong.album?.images?.[0]?.url ||
              "https://via.placeholder.com/60"
            }
            alt="Album"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        {/* Song Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {currentSong.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {currentSong.artists?.map((a: any) => a.name).join(", ")}
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleClick}
            size="large"
            sx={{ color: "primary.main" }}
          >
            {currentSong.isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton
            onClick={() => setIsRepeat(!isRepeat)}
            size="small"
            sx={{ color: isRepeat ? "primary.main" : "text.secondary" }}
          >
            <Replay />
          </IconButton>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ minWidth: 40 }}>
            {formatTime(currentSong.position)}
          </Typography>
          <Slider
            value={currentSong.position}
            max={currentSong.duration}
            onChange={handleSeek}
            sx={{ mx: 1 }}
          />
          <Typography variant="caption" sx={{ minWidth: 40 }}>
            {formatTime(currentSong.duration)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default Player;
