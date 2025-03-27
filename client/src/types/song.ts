// src/types/song.ts
export type Song = {
  track: {
    name: string;
    artists: { name: string }[];
    id: number;
    uri: string;
    duration_ms: number;
  };
  clips: {
    startTimes: number[];
    endTimes: number[];
  };
};
