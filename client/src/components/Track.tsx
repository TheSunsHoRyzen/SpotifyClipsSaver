import React, { useCallback } from "react";
import { Song } from "../types/song";
import { checkToken } from "../checkToken";
type TrackProps = {
  song: Song;
  deviceID: string | null;
};

function Track({ song, deviceID }: TrackProps) {
  // console.log(song);
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

    try {
      // First, get player state to check if we need to transfer playback
      const playerState = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${token}`,
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_ids: [deviceID],
          play: false,
        }),
      });

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
    } catch (err) {
      console.error("Error in handlePlay:", err);
      // Try to refresh token on error
      // const newToken = await checkToken();
      // if (newToken) {
      //   console.log("Token refreshed after play error");
      // }
    }
  }, [deviceID, song.track.uri]);

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
      } catch (err) {
        console.error("Error playing track", err);
      }
    }
  }, [deviceID]);
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
