// src/types/song.ts
export type Song = {
    track: {
      name: string;
      artists: { name: string }[];
      id: number;
      uri: string;
    };
  };
  