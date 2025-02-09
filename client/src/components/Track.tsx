import React, { useCallback, useState, useEffect } from "react";
import { Song } from "../types/song";
import { checkToken } from "../checkToken";
type TrackProps = {
  song: Song;
  deviceID: string | null;
  player: any;
};

function Track({ song, deviceID, player }: TrackProps) {
  const [segmentStart, setSegmentStart] = useState(0);
  const [segmentEnd, setSegmentEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [positionPollingInterval, setPositionPollingInterval] =
    useState<NodeJS.Timer | null>(null);
  // const [isPaused, setIsPaused] = useState(true);
  setDuration(song.track.duration);
  // console.log(song);
  // Set initial segment end when duration changes

  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${paddedSeconds}`;
  }, []);

  useEffect(() => {
    const checkPlayerState = async () => {
      try {
        const playerState = await fetch(
          "https://api.spotify.com/v1/me/player",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (playerState.status === 204) {
          console.log("No active device found, transferring playback...");
        }

        // Transfer playback
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            device_ids: [deviceID],
            play: false,
          }),
        });
      } catch (err) {
        console.error("Error in handlePlay:", err);
      }
    };

    checkPlayerState();
  }, [deviceID]);

  useEffect(() => {
    if (duration > 0 && segmentEnd === 0) {
      setSegmentEnd(duration);
    }
  }, [duration, segmentEnd]);

  const handlePlay = useCallback(async () => {
    if (!deviceID) {
      console.error("No device ID available");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token available");
      return;
    }
    // playback transfer logic goes here if need be, with catch going after if !(playerResponse)

    // Wait for transfer
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Start playback
    const playResponse = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceID}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uris: [song.track.uri],
          position_ms: 0,
        }),
      }
    );

    if (!playResponse.ok) {
      const error = await playResponse.json();
      console.error("Play response error:", error);
      throw new Error(`HTTP error! status: ${playResponse.status}`);
    }

    // Try to refresh token on error
  }, [deviceID, song.track.uri]);

  useEffect(() => {
    if (player) {
      // Clear any existing interval
      if (positionPollingInterval) {
        clearInterval(positionPollingInterval);
      }

      // Create new polling interval
      const interval = setInterval(async () => {
        const state = await player.getCurrentState();
        if (state) {
          setPosition(state.position);

          // Check if we need to loop
          if (state.position >= segmentEnd) {
            player.seek(segmentStart).then(() => {
              console.log("Looped back to segment start");
            });
          }
        }
      }, 100); // Poll every 100ms

      setPositionPollingInterval(interval);

      // Cleanup
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [player, segmentStart, segmentEnd]);

  const handleSegmentStartChange = useCallback(
    (value: number) => {
      setSegmentStart(value);
      if (value > segmentEnd) {
        setSegmentEnd(value);
      }
      // Seek to new start position when changing segment start
      if (player && !isPaused) {
        player.seek(value);
      }
    },
    [segmentEnd, player, isPaused]
  );

  const handleSegmentEndChange = useCallback(
    (value: number) => {
      setSegmentEnd(value);
      if (value < segmentStart) {
        setSegmentStart(value);
      }
    },
    [segmentStart]
  );

  const handlePause = useCallback(async () => {
    if (!deviceID) return;
    if (localStorage.getItem("access_token")) {
      const fetchToken = async () => {
        const accesstoken = await checkToken();
        if (accesstoken) {
          console.log("access token received");
        }
      };
      fetchToken();

      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/pause?device_id=${deviceID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            // body: JSON.stringify({ uris: [trackURI], position_ms: segmentStart }),
          }
        );
        setIsPaused(true);
      } catch (err) {
        console.error("Error playing track", err);
      }
    }
  }, [deviceID]);

  const handleTogglePlay = useCallback(() => {
    if (!player) return;

    player.togglePlay().then(() => {
      console.log("Toggled playback!");
    });
  }, [player]);

  return (
    <li key={song.track.id}>
      <div className="flex flex-col items-start p-4 ">
        <h3 className="">
          {song.track.name} by{" "}
          {song.track.artists.map((artist, index) => (
            <span key={index} className="font-bold">
              {artist.name}
              {index < song.track.artists.length - 1 ? ", " : ""}
            </span>
          ))}
        </h3>
        <button
          className="text-green-500 hover:text-green-400 "
          onClick={handlePlay}
        >
          Play
        </button>
        <button
          className="text-green-500 hover:text-green-400 "
          onClick={handlePause}
        >
          Pause
        </button>
      </div>
    </li>
  );
}

export default Track;
