import React, { useCallback, useEffect, useState } from "react";
import { Song } from "../types/song";
import { usePlayer } from "../context/PlayerContext";

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
  const [showPopup, setShowPopup] = useState(false);
  const [startTime, setStartTime] = useState<string>("0:00");
  const [endTime, setEndTime] = useState<string>("0:00");
  const [isPlayingClip, setIsPlayingClip] = useState(false);
  const [activeClip, setActiveClip] = useState<Clip | null>(null);

  //handle user clicking play button (NOT clip!)
  const handlePlay = useCallback(async () => {
    if (!deviceID) {
      console.error("No device ID available");
      return;
    }

    try {
      // Get player state from backend
      const playerState = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/spotify/player`,
        {
          credentials: "include",
        }
      );

      if (playerState.status === 204) {
        console.log("No active device found, transferring playback...");
      }

      // Transfer playback using backend
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          device_ids: [deviceID],
          play: false,
        }),
      });

      // Wait for transfer
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start playback using backend
      const playResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/spotify/player/play`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            device_id: deviceID,
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
        isClip: false,
      });
    } catch (err) {
      console.error("Error in handlePlay:", err);
    }
  }, [deviceID, song.track, setCurrentSong]);

  //handle user clicking pause button (NOT clip!)
  // const handlePause = useCallback(async () => {
  //   if (!deviceID) return;

  //   try {
  //     await fetch(
  //       `http://localhost:8080/spotify/player/pause?device_id=${deviceID}`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       }
  //     );

  //     setCurrentSong({
  //       ...song.track,
  //       duration: song.track.duration_ms,
  //       position: 0,
  //       isPlaying: false,
  //       isClip: currentSong?.isClip || false,
  //     });
  //   } catch (err) {
  //     console.error("Error pausing track", err);
  //   }
  // }, [deviceID, setCurrentSong, currentSong, song.track]);

  const handleAuth = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSaveClip = async () => {
    try {
      // Validate clip times
      const start_parts: string[] = startTime.split(":");
      if (start_parts.length !== 2) return null;
      const [minStr, secStr] = start_parts;

      const mins: number = Number(minStr);
      const secs: number = Number(secStr);
      if (
        !Number.isFinite(mins) ||
        !Number.isFinite(secs) ||
        mins < 0 ||
        secs < 0 ||
        secs >= 60
      ) {
        alert("Invalid Start Time!");
        return null;
      }

      const parsedStartTime = mins * 60 + secs;
      // Check if start time is longer than the song or less than 0
      if (
        parsedStartTime * 1000 > song.track.duration_ms ||
        parsedStartTime < 0
      ) {
        alert("Start time is longer than the song!");
        return null;
      }

      const end_parts: string[] = endTime.split(":");
      if (end_parts.length !== 2) return null;
      const [endMinStr, endSecStr] = end_parts;

      const endMins: number = Number(endMinStr);
      const endSecs: number = Number(endSecStr);

      if (
        !Number.isFinite(endMins) ||
        !Number.isFinite(endSecs) ||
        endMins < 0 ||
        endSecs < 0 ||
        endSecs >= 60
      ) {
        alert("Invalid End Time!");
        return null;
      }

      const parsedEndTime = endMins * 60 + endSecs;

      // Check if end time is longer than the song or less than 0
      if (parsedEndTime * 1000 > song.track.duration_ms || parsedEndTime < 0) {
        alert("End time is invalid!");
        return null;
      }
      // Check if the start time and end time are equal

      if (parsedEndTime === parsedStartTime) {
        alert("Start time and end time are the same!");
        return null;
      }

      const response = await fetch("http://localhost:8080/db/createClip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          trackUri: song.track.uri,
          start: parsedStartTime,
          end: parsedEndTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save clip");
      }

      // After saving, trigger a refresh of the parent's clips data
      // This will be handled by the parent component's useEffect
      setShowPopup(false);
      setStartTime("0:00");
      setEndTime("0:00");

      //re-render clips using parent function
      onClipEvent();
      // Show success message
      alert("Clip saved successfully!");
    } catch (error) {
      console.error("Error saving clip:", error);
      alert("Failed to save clip. Please try again.");
    }
  };
  const handleDeleteClip = async (start: number, end: number, id: string) => {
    try {
      // Validate clip times

      const response = await fetch("http://localhost:8080/db/deleteClip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          trackUri: song.track.uri,
          start: start,
          end: end,
          id: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete clip");
      }

      //re-render clips using function in parent
      onClipEvent();
      // Show success message
      alert("Clip deleted successfully!");
    } catch (error) {
      console.error("Error deleting clip:", error);
      alert("Failed to delete clip. Please try again.");
    }
  };

  const playClip = useCallback(
    async (clip: Clip) => {
      if (!deviceID || !player) return;

      try {
        // Transfer playback using backend
        await fetch("http://localhost:8080/spotify/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            device_ids: [deviceID],
            play: false,
          }),
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Start playback using backend
        await fetch("http://localhost:8080/spotify/player/play", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            device_id: deviceID,
            uris: [song.track.uri],
            position_ms: clip.start * 1000,
          }),
        });

        setCurrentSong({
          ...song.track,
          duration: song.track.duration_ms,
          position: clip.start,
          isPlaying: true,
          isClip: true,
        });

        setActiveClip(clip);
        setIsPlayingClip(true);
      } catch (err) {
        console.error("Error in playClip:", err);
      }
    },
    [deviceID, song.track, setCurrentSong, player]
  );

  useEffect(() => {
    if (!isPlayingClip || !player || !activeClip || !currentSong?.isClip)
      return;

    const interval = setInterval(async () => {
      const state = await player.getCurrentState();
      if (state && state.position >= activeClip.end * 1000) {
        await player.seek(activeClip.start * 1000);
        console.log(`Looped back to ${activeClip.start}s`);
        // setCurrentSong({
        //   ...song.track,
        //   duration: song.track.duration_ms,
        //   position: activeClip.start,
        //   isPlaying: true,
        //   isClip: true,
        // });
      }
    }, 900);

    return () => clearInterval(interval);
  }, [
    isPlayingClip,
    activeClip,
    player,
    currentSong?.isClip,
    setCurrentSong,
    song.track,
  ]);

  return (
    <div>
      <li key={song.track.id}>
        <div className="flex flex-col items-start p-4 ">
          <h3 className="flex items-center">
            {song.track.name} by{" "}
            {song.track.artists.map((artist, index) => (
              <span key={index} className="font-bold ml-1">
                {" "}
                {artist.name}
                {index < song.track.artists.length - 1 ? ", " : " "}
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
          {/* <button
            className="text-green-500 hover:text-green-400 "
            onClick={handlePause}
          >
            Pause
          </button> */}
          <div className="flex flex-col gap-2 mt-2">
            {song.clips.startTimes &&
            song.clips.endTimes &&
            song.clips.startTimes.length === song.clips.endTimes.length ? (
              song.clips.startTimes.map((start, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Clip: {start}s - {song.clips.endTimes[index]}s
                  </span>
                  <button
                    className="text-green-500 hover:text-green-400"
                    onClick={() =>
                      playClip({
                        id: index.toString(), // don't need?
                        start,
                        end: song.clips.endTimes[index],
                      })
                    }
                  >
                    Play Clip
                  </button>
                  <button
                    className="text-green-500 hover:text-green-400"
                    onClick={() => {
                      handleDeleteClip(
                        start,
                        song.clips.endTimes[index],
                        song.clips.ids[index]
                      );
                    }}
                  >
                    Delete Clip
                  </button>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-500">No clips available</span>
            )}
          </div>
        </div>
      </li>

      {showPopup && (
        <div className="flex flex-col items-start p-4">
          <div className="flex items-center">
            <button
              className="text-white size-6 bg-black box-border"
              onClick={handleClosePopup}
            >
              X
            </button>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-base">
              Start Time:
              <input
                type="text"
                placeholder="mm:ss"
                className="ml-2 p-1 border rounded"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="text-base">
              End Time:
              <input
                type="text"
                placeholder="mm:ss"
                className="ml-2 p-1 border rounded"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
            <button
              className="mt-2 p-2 bg-blue-500 text-white rounded"
              onClick={handleSaveClip}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Track;
