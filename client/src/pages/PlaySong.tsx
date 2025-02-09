// "use client";
import React from "react";

function PlaySong() {
  return <div></div>;
}

export default PlaySong;

// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import Script from "next/script";

// function PlaySong() {
//   // Replace with your own *valid* access token that has the necessary scopes
//   const [token, setToken] = useState(localStorage.getItem("access_token"));
//   // Player states
//   const [player, setPlayer] = useState(null);
//   const [deviceId, setDeviceId] = useState(null);
//   const [isPaused, setIsPaused] = useState(true);
//   const [currentTrack, setCurrentTrack] = useState("");
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [segmentStart, setSegmentStart] = useState(0);
//   const [segmentEnd, setSegmentEnd] = useState(0);

//   // Add polling interval state
//   const [positionPollingInterval, setPositionPollingInterval] = useState(null);

//   // This is the track you want to play
//   // e.g., "spotify:track:4uLU6hMCjMI75M1A2tKUQC" (Don't Stop Believin')
//   const trackURI = "spotify:track:4uLU6hMCjMI75M1A2tKUQC";

//   // Helper function to convert milliseconds to mm:ss
//   const formatTime = useCallback((ms) => {
//     const totalSeconds = Math.floor(ms / 1000);
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = totalSeconds % 60;
//     const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
//     return `${minutes}:${paddedSeconds}`;
//   }, []);

//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src = "https://sdk.scdn.co/spotify-player.js";
//     script.async = true;
//     document.body.appendChild(script);

//     window.onSpotifyWebPlaybackSDKReady = () => {
//       const spotifyPlayer = new window.Spotify.Player({
//         name: "My React Web Player",
//         getOAuthToken: (cb) => {
//           cb(token);
//         },
//         volume: 0.5,
//       });

//       // Event handlers
//       spotifyPlayer.addListener("ready", ({ device_id }) => {
//         console.log("Ready with Device ID", device_id);
//         setDeviceId(device_id);
//       });
//       spotifyPlayer.addListener("not_ready", ({ device_id }) => {
//         console.log("Device ID has gone offline", device_id);
//       });
//       spotifyPlayer.addListener("player_state_changed", (state) => {
//         if (!state) {
//           return;
//         }
//         setIsPaused(state.paused);
//         setDuration(state.duration);

//         // The track window may have the track details
//         const current = state.track_window.current_track;
//         if (current) {
//           setCurrentTrack(current.name);
//         }
//       });

//       // Connect to the player!
//       spotifyPlayer.connect();
//       setPlayer(spotifyPlayer);
//     };

//     return () => {
//       // Cleanup script if needed
//       document.body.removeChild(script);
//     };
//   }, [token]);

//   // 4. Transfer Playback to the new device once deviceId is set
//   useEffect(() => {
//     if (deviceId) {
//       // Transfer the playback to this deviceId
//       axios({
//         method: "put",
//         url: "https://api.spotify.com/v1/me/player",
//         data: {
//           device_ids: [deviceId],
//           play: false,
//         },
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       })
//         .then(() => {
//           console.log("Playback transferred");
//         })
//         .catch((err) => console.error(err));
//     }
//   }, [deviceId, token]);

//   // Set initial segment end when duration changes
//   useEffect(() => {
//     if (duration > 0 && segmentEnd === 0) {
//       setSegmentEnd(duration);
//     }
//   }, [duration, segmentEnd]);

//   // Set up position polling when player is ready
//   useEffect(() => {
//     if (player) {
//       // Clear any existing interval
//       if (positionPollingInterval) {
//         clearInterval(positionPollingInterval);
//       }

//       // Create new polling interval
//       const interval = setInterval(async () => {
//         const state = await player.getCurrentState();
//         if (state) {
//           setPosition(state.position);

//           // Check if we need to loop
//           if (state.position >= segmentEnd) {
//             player.seek(segmentStart).then(() => {
//               console.log("Looped back to segment start");
//             });
//           }
//         }
//       }, 100); // Poll every 100ms

//       setPositionPollingInterval(interval);

//       // Cleanup
//       return () => {
//         if (interval) {
//           clearInterval(interval);
//         }
//       };
//     }
//   }, [player, segmentStart, segmentEnd]);

//   // Function to update segment start time
//   const handleSegmentStartChange = useCallback(
//     (value: number) => {
//       setSegmentStart(value);
//       if (value > segmentEnd) {
//         setSegmentEnd(value);
//       }
//       // Seek to new start position when changing segment start
//       if (player && !isPaused) {
//         player.seek(value);
//       }
//     },
//     [segmentEnd, player, isPaused]
//   );

//   // Function to update segment end time
//   const handleSegmentEndChange = useCallback(
//     (value: number) => {
//       setSegmentEnd(value);
//       if (value < segmentStart) {
//         setSegmentStart(value);
//       }
//     },
//     [segmentStart]
//   );

//   // Function to start playing the track
//   const handlePlay = useCallback(async () => {
//     if (!deviceId) return;

//     try {
//       await axios({
//         method: "put",
//         url: `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
//         data: {
//           uris: [trackURI],
//           position_ms: segmentStart,
//         },
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//     } catch (err) {
//       console.error("Error playing track", err);
//     }
//   }, [deviceId, token, trackURI, segmentStart]);

//   // Function to toggle pause/play
//   const handleTogglePlay = useCallback(() => {
//     if (!player) return;

//     player.togglePlay().then(() => {
//       console.log("Toggled playback!");
//     });
//   }, [player]);

//   // Build a simple progress bar
//   // The progress ratio is position/duration
//   const progressPercentage = duration ? (position / duration) * 100 : 0;

//   return (
//     <div style={{ margin: "30px auto", width: "50%", textAlign: "center" }}>
//       <Script
//         src="https://sdk.scdn.co/spotify-player.js"
//         strategy="afterInteractive"
//         onLoad={() => {
//           console.log("Spotify Web Playback SDK loaded");
//         }}
//       />
//       <h1>Spotify Player Demo</h1>

//       {/* Current Song */}
//       <h2>{currentTrack || "No Track Selected"}</h2>

//       {/* Current Position and Duration */}
//       <div>
//         {formatTime(position)} / {formatTime(duration)}
//       </div>

//       {/* Progress Bar */}
//       <div
//         style={{
//           margin: "10px auto",
//           height: "10px",
//           width: "100%",
//           background: "#ccc",
//           borderRadius: "5px",
//           position: "relative",
//         }}
//       >
//         <div
//           style={{
//             height: "10px",
//             width: `${progressPercentage}%`,
//             background: "#1db954",
//             borderRadius: "5px",
//           }}
//         />
//       </div>

//       {/* Segment Controls */}
//       <div style={{ margin: "20px" }}>
//         <div>
//           <label>Segment Start: </label>
//           <input
//             type="range"
//             min={0}
//             max={duration}
//             value={segmentStart}
//             onChange={(e) => handleSegmentStartChange(Number(e.target.value))}
//           />
//           <span>{formatTime(segmentStart)}</span>
//         </div>
//         <div>
//           <label>Segment End: </label>
//           <input
//             type="range"
//             min={0}
//             max={duration}
//             value={segmentEnd}
//             onChange={(e) => handleSegmentEndChange(Number(e.target.value))}
//           />
//           <span>{formatTime(segmentEnd)}</span>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div style={{ margin: "20px" }}>
//         <button onClick={handlePlay}>Play Track</button>
//         <button onClick={handleTogglePlay}>
//           {isPaused ? "Resume" : "Pause"}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default PlaySong;
