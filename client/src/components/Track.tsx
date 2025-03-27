import React, { useCallback } from "react";
import { Song } from "../types/song";
import { checkToken } from "../checkToken";
import { usePlayer } from "../context/PlayerContext";

type TrackProps = {
  song: Song;
  deviceID: string | null;
  player: any;
};

function Track({ song, deviceID, player }: TrackProps) {
  // const [segmentStart, setSegmentStart] = useState(0);
  // const [segmentEnd, setSegmentEnd] = useState(0);
  // const [duration, setDuration] = useState(0);
  // const [position, setPosition] = useState(0);
  // const [positionPollingInterval, setPositionPollingInterval] =
  //   useState<NodeJS.Timer | null>(null);
  // // const [isPaused, setIsPaused] = useState(true);
  // setDuration(song.track.duration);
  // console.log(song);
  // Set initial segment end when duration changes

  // const formatTime = useCallback((ms) => {
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  //   return `${minutes}:${paddedSeconds}`;
  // }, []);

  // useEffect(() => {
  //   if (duration > 0 && segmentEnd === 0) {
  //     setSegmentEnd(duration);
  //   }
  // }, [duration, segmentEnd]);

  const { setCurrentSong } = usePlayer();

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
    try {
      const playerState = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

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

      // Wait for transfer
      await new Promise((resolve) => setTimeout(resolve, 100));

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
      setCurrentSong({
        ...song.track,
        duration: song.track.duration_ms,
        position: 0,
        isPlaying: true,
      });
    } catch (err) {
      console.error("Error in handlePlay:", err);
    }
    // Try to refresh token on error
  }, [deviceID, song.track, setCurrentSong]);

  // useEffect(() => {
  //   if (player) {
  //     // Clear any existing interval
  //     if (positionPollingInterval) {
  //       clearInterval(positionPollingInterval);
  //     }

  //     // Create new polling interval
  //     const interval = setInterval(async () => {
  //       const state = await player.getCurrentState();
  //       if (state) {
  //         setPosition(state.position);

  //         // Check if we need to loop
  //         if (state.position >= segmentEnd) {
  //           player.seek(segmentStart).then(() => {
  //             console.log("Looped back to segment start");
  //           });
  //         }
  //       }
  //     }, 100); // Poll every 100ms

  //     setPositionPollingInterval(interval);

  //     // Cleanup
  //     return () => {
  //       if (interval) {
  //         clearInterval(interval);
  //       }
  //     };
  //   }
  // }, [player, segmentStart, segmentEnd]);

  // const handleSegmentStartChange = useCallback(
  //   (value: number) => {
  //     setSegmentStart(value);
  //     if (value > segmentEnd) {
  //       setSegmentEnd(value);
  //     }
  //     // Seek to new start position when changing segment start
  //     if (player && !isPaused) {
  //       player.seek(value);
  //     }
  //   },
  //   [segmentEnd, player, isPaused]
  // );

  // const handleSegmentEndChange = useCallback(
  //   (value: number) => {
  //     setSegmentEnd(value);
  //     if (value < segmentStart) {
  //       setSegmentStart(value);
  //     }
  //   },
  //   [segmentStart]
  // );

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
        setCurrentSong({
          ...song.track,
          duration: song.track.duration_ms,
          position: 0,
          isPlaying: false,
        });
      } catch (err) {
        console.error("Error playing track", err);
      }
    }
  }, [deviceID, setCurrentSong, song.track]);

  // const handleTogglePlay = useCallback(() => {
  //   if (!player) return;

  //   player.togglePlay().then(() => {
  //     console.log("Toggled playback!");
  //   });
  // }, [player]);
  const handleAuth = useCallback(async () => {
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
    try {
      const playerState = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

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

      // Wait for transfer
      await new Promise((resolve) => setTimeout(resolve, 100));

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
            position_ms: 23000,
          }),
        }
      );

      if (!playResponse.ok) {
        const error = await playResponse.json();
        console.error("Play response error:", error);
        throw new Error(`HTTP error! status: ${playResponse.status}`);
      }
      setCurrentSong({
        ...song.track,
        duration: song.track.duration_ms,
        position: 23 / song.track.duration_ms,
        isPlaying: true,
      });
    } catch (err) {
      console.error("Error in handlePlay:", err);
    }
    // Try to refresh token on error
  }, [deviceID, song.track, setCurrentSong]);

  // const access_token = localStorage.getItem("access_token");
  // const userID = localStorage.getItem("user_id");

  // if (!access_token || !userID) {
  //   alert("Please login first");
  //   return;
  // }

  // try {
  //   // Send both tokens to our backend
  //   const response = await fetch(
  //     `http://localhost:8080/auth/db?auth_token=${access_token}&userID=${userID}&uri=${song.track.uri}`,
  //     {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );

  //   const data = await response.json();

  //   if (!response.ok) {
  //     // If response is not 200, show the error message from the backend
  //     alert(data.error);
  //     return;
  //   }

  //   alert(data.message); // Show the success message from backend
  // } catch (error) {
  //   console.error("Error:", error);
  //   alert("Failed to verify user");
  // }

  return (
    <div>
      <li key={song.track.id}>
        <div className="flex flex-col items-start p-4 ">
          <h3 className="flex items-center">
            {song.track.name} by{" "}
            {song.track.artists.map((artist, index) => (
              <span key={index} className="font-bold">
                {artist.name}
                {index < song.track.artists.length - 1 ? ", " : ""}
              </span>
            ))}
            <button
              className="box-border p-2 m-1 rounded-2xl bg-red-500 flex items-center justify-center h-6 ml-2"
              onClick={handleAuth}
            >
              {" "}
              +
            </button>
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
    </div>
  );
}

export default Track;
