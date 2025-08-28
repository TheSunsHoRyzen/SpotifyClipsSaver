// src/types/song.ts
export type Song = {
  track: {
    name: string;
    artists: { name: string }[];
    id: number;
    uri: string;
    duration_ms: number;
    album?: {
      name: string;
      images: { url: string }[];
    };
  };
  clips: {
    startTimes: number[];
    endTimes: number[];
    ids: string[];
  };
};
