import React, { useState, useEffect } from "react";
// import { Song } from "../types/song";
import {
  PauseCircleIcon,
  PlayCircleIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";

interface PlayerProps {
  deviceID: string | null;
}

function Player({ deviceID }: PlayerProps) {
  const { currentSong, setCurrentSong } = usePlayer();
  const [isRepeat, setIsRepeat] = useState(false);

  // Add play/pause handler
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handlePlayPause();
  };

  const handlePlayPause = async () => {
    if (!currentSong) return;

    try {
      const endpoint = currentSong.isPlaying ? "pause" : "play";

      if (endpoint === "pause") {
        // Use the pause endpoint
        const response = await fetch(
          `http://localhost:8080/spotify/player/pause?device_id=${deviceID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok || response.status === 204) {
          if (currentSong) {
            setCurrentSong({
              ...currentSong,
              isPlaying: false,
            });
          }
        } else {
          const errorData = await response.text();
          console.error("Failed to pause playback:", errorData);
        }
      } else {
        // Use the play endpoint
        const response = await fetch(
          `http://localhost:8080/spotify/player/play?device_id=${deviceID}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok || response.status === 204) {
          if (currentSong) {
            setCurrentSong({
              ...currentSong,
              isPlaying: true,
            });
          }
        } else {
          const errorData = await response.text();
          console.error("Failed to play playback:", errorData);
        }
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  // Update polling to handle errors gracefully
  useEffect(() => {
    if (!currentSong) return;
    let errorCount = 0;
    const maxErrors = 3;
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:8080/spotify/player", {
          credentials: "include",
          method: "GET",
        });

        if (response.status === 204) {
          // No active playback - don't change the isPlaying state
          return;
        }
        if (response.ok) {
          console.log("Refresh");
          const state = await response.json();
          if (currentSong) {
            const newIsPlaying = state.is_playing;
            // console.log("Duration");

            if (currentSong.isPlaying !== newIsPlaying) {
              setCurrentSong({
                ...currentSong,
                position: state.progress_ms,
                isPlaying: newIsPlaying,
              });
            } else {
              // Just update the position
              setCurrentSong({
                ...currentSong,
                position: state.progress_ms,
              });
            }
            errorCount = 0;
          }
        } else {
          errorCount++;
          console.warn(`Polling failed (${errorCount}/${maxErrors})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Polling error (${errorCount}/${maxErrors}):`, error);
      }

      if (errorCount >= maxErrors) {
        console.warn("Max polling errors reached. Stopping polling.");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong, setCurrentSong]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-[12.5vh] bg-white shadow-lg">
        <div className="w-full px-4 py-2 flex items-center justify-center">
          <span className="text-gray-400">No track selected</span>
        </div>
      </div>
    );
  }

  const progress = (currentSong.position / currentSong.duration) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[15.5vh] bg-white shadow-lg">
      <div className="w-full px-4 py-2">
        {currentSong.name && (
          <div className="text-center mb-2">
            <span className="font-medium">{currentSong.name}</span>
            {currentSong.artists && (
              <span className="text-gray-600">
                {" "}
                - {currentSong.artists.map((a) => a.name).join(", ")}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-gray-600">
            {formatTime(currentSong.position)}
          </span>
          <div className="w-4/6 bg-gray-200 h-1 rounded-full">
            <div
              className="bg-black h-1 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {formatTime(currentSong.duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center mt-4 gap-4">
          <button
            onClick={handleClick}
            className="text-black hover:text-gray-700 transition-colors"
          >
            {currentSong.isPlaying ? (
              <PauseCircleIcon className="h-10 w-10" />
            ) : (
              <PlayCircleIcon className="h-10 w-10" />
            )}
          </button>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`transition-colors ${
              isRepeat
                ? "text-green-500 hover:text-green-400"
                : "text-black hover:text-gray-500"
            }`}
          >
            <ArrowPathRoundedSquareIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Player;
