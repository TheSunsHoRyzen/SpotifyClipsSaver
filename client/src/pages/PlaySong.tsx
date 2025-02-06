import React, { useEffect, useState, useCallback } from "react";
import { checkToken } from "../checkToken";
function PlaySong() {
  const [player, setPlayer] = useState(null);
  const [token, setToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState("");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segmentStart, setSegmentStart] = useState(0);
  // const [segmentEnd, setSegmentEnd] = useState(0);
  const trackURI = "spotify:track:4uLU6hMCjMI75M1A2tKUQC";
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (localStorage.getItem("access_token")) {
        const fetchToken = async () => {
          const accesstoken = await checkToken();
          if (accesstoken) {
            setToken(accesstoken);
          }
        };
        fetchToken();
      }
      const spotifyPlayer = new window.Spotify.Player({
        name: "My React Web Player",
        getOAuthToken: (cb) => {
          cb(localStorage.getItem("access_token"));
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      spotifyPlayer.addListener("player_state_changed", (state) => {
        if (!state) return;
        setIsPaused(state.paused);
        setDuration(state.duration);
        if (state.track_window.current_track) {
          setCurrentTrack(state.track_window.current_track.name);
        }
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const handlePlay = useCallback(async () => {
    if (!deviceId) return;

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uris: [trackURI], position_ms: segmentStart }),
        }
      );
    } catch (err) {
      console.error("Error playing track", err);
    }
  }, [deviceId, token, trackURI, segmentStart]);

  return (
    <button
      className="text-green-500 hover:text-green-400"
      onClick={handlePlay}
    >
      Play
    </button>
  );
}

export default PlaySong;
