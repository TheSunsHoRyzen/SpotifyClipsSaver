import React, { createContext, useState, useContext } from "react";

type PlayerContextType = {
  currentSong: {
    duration: number;
    position: number;
    isPlaying: boolean;
    name?: string;
    artists?: { name: string }[];
    uri?: string;
  } | null;
  setCurrentSong: (song: PlayerContextType["currentSong"]) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// interface Props {
//   children: React.ReactNode;
// }

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] =
    useState<PlayerContextType["currentSong"]>(null);

  return (
    <PlayerContext.Provider value={{ currentSong, setCurrentSong }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
