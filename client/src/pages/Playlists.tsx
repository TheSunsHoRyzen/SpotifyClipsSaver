// Playlists.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Track from "../components/Track";
import { Song } from "../types/song";
import Player from "../components/Player";
import { PlayerProvider } from "../context/PlayerContext";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { Delete, NavigateNext, NavigateBefore } from "@mui/icons-material";

declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (callback: (token: string | null) => void) => void;
        volume: number;
        config: {};
      }) => any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface Playlist {
  id: string;
  name: string;
}

function Playlists() {
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(-1);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  // ---------------------------
  // Updated player setup effect
  // ---------------------------
  useEffect(() => {
    // Add the SDK script once
    const scriptId = "spotify-player-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    let spotifyPlayer: any;

    window.onSpotifyWebPlaybackSDKReady = () => {
      spotifyPlayer = new window.Spotify.Player({
        name: "Spotify Clip Saver",
        getOAuthToken: (cb: (token: string | null) => void) => {
          fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/player-token`, {
            credentials: "include",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to get player token");
              }
              return response.json();
            })
            .then((data) => cb(data.access_token))
            .catch((err) => {
              console.error("Error getting player token:", err);
              cb(null);
            });
        },
        volume: 1,
        config: {
          playback: {
            robustness: "SW_SECURE_DECODE",
          },
        },
      });

      spotifyPlayer.addListener(
        "ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Ready with Device ID", device_id);
          setDeviceId(device_id);
        }
      );

      spotifyPlayer.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id);
        }
      );
      // log player state changes for debugging purposes
      // spotifyPlayer.addListener("player_state_changed", (state: any) => {
      //   if (state) {
      //     console.log("Player state changed:", state);
      //   }
      // });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      try {
        if (spotifyPlayer && typeof spotifyPlayer.disconnect === "function") {
          spotifyPlayer.disconnect();
        }
      } catch (e) {
        console.warn("Error during Spotify player cleanup:", e);
      }
    };
  }, []);

  // Fetch playlists on mount
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/spotify/v1/me/playlists/`, {
      credentials: "include",
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Could not get available playlists ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((allPlaylists) => {
        setPlaylists(allPlaylists.items);
      })
      .catch((err) => {
        setError(err.message);
        console.log(err.message);
      });
  }, []);

  // Select handler now uses playlist ID directly
  const handlePlaylistSelect = (playlistId: string) => {
    window.dispatchEvent(new Event("STOP_CLIP_LOOPS"));
    setSelectedPlaylist(playlistId);
    setOffset(0);
    setSongs([]);
  };

  // load next/prev page
  const loadNextPage = () => {
    setOffset((prevOffset) =>
      prevOffset + limit <= total ? prevOffset + limit : prevOffset
    );
  };
  const loadPrevPage = () => {
    setOffset((prevOffset) =>
      prevOffset - limit > 0 ? prevOffset - limit : 0
    );
  };

  // Delete old clips unchanged
  const deleteOldClips = async () => {
    if (!selectedPlaylist) return;

    let doesClipExist = new Map();
    setLoading(true);

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/db/getClips`,
      { credentials: "include" }
    );
    if (!response.ok) {
      setLoading(false);
      throw new Error("Failed to fetch clips");
    }

    const everyClip = await response.json();
    for (let clip in everyClip) {
      doesClipExist.set(clip, false);
    }

    const repeatingStep = async (tempOffset: number): Promise<Song[]> => {
      const r = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/spotify/playlist/${selectedPlaylist}/tracks?offset=${tempOffset}&limit=${limit}`,
        { credentials: "include" }
      );
      if (!r.ok) {
        throw new Error(
          `Could not get available playlist songs: ${r.statusText}`
        );
      }
      const newSongs = await r.json();
      return newSongs.items as Song[];
    };

    for (let i = 0; i < total; i += limit) {
      let pageSongs: Song[] = await repeatingStep(i);
      for (const song of Object.values(pageSongs)) {
        if (!doesClipExist.get((song as any).track.uri)) {
          doesClipExist.set((song as any).track.uri, true);
        }
      }
    }

    for (const [key, value] of doesClipExist) {
      if (!value) {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/db/deleteClip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            trackUri: key,
            start: 0,
            end: 0,
            id: "all",
          }),
        });
      }
    }
    setLoading(false);
  };

  // Fetch songs when playlist + offset change
  useEffect(() => {
    if (selectedPlaylist && offset >= 0) {
      setLoading(true);
      fetch(
        `${process.env.REACT_APP_BACKEND_URL}/spotify/playlist/${selectedPlaylist}/tracks?offset=${offset}&limit=${limit}`,
        { credentials: "include" }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Could not get available playlist songs: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          const songsWithClips = data.items.map((song: any) => ({
            ...song,
            clips: {
              startTimes: [],
              endTimes: [],
              ids: [],
            },
          }));
          setSongs(songsWithClips);
          setTotal(data.total);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [selectedPlaylist, offset]);

  // ---------------------------
  // Fix B: guarded clips fetch
  // ---------------------------
  const arraysEqual = (a?: any[], b?: any[]) =>
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => v === b[i]);

  const fetchClips = useCallback(async (_uris: string[]) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/db/getClips`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch clips");
      }
      const clips = await response.json();

      setSongs((prevSongs) =>
        prevSongs.map((song) => {
          const nextClips = clips[song.track.uri] ?? {
            startTimes: [],
            endTimes: [],
            ids: [],
          };
          const prevClips =
            song.clips ?? ({ startTimes: [], endTimes: [], ids: [] } as any);

          const unchanged =
            arraysEqual(prevClips.startTimes, nextClips.startTimes) &&
            arraysEqual(prevClips.endTimes, nextClips.endTimes) &&
            arraysEqual(prevClips.ids, nextClips.ids);

          return unchanged ? song : { ...song, clips: nextClips };
        })
      );
    } catch (error) {
      console.error("Error fetching clips:", error);
    }
  }, []);

  // Guard so we only call fetchClips when the set of URIs for the current page changes
  const lastUrisRef = useRef<string>("");
  useEffect(() => {
    if (!songs.length) return;
    const uris = songs.map((s) => s.track.uri).join(",");
    if (uris === lastUrisRef.current) return;
    lastUrisRef.current = uris;

    fetchClips(songs.map((s) => s.track.uri));
  }, [songs, fetchClips]);

  // Reset the guard when playlist/offset change (ensures new page triggers a fetch)
  useEffect(() => {
    lastUrisRef.current = "";
  }, [selectedPlaylist, offset]);

  return (
    <PlayerProvider>
      <Container sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Playlists
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: 1, width: "100%" }}>
              <FormControl fullWidth>
                <InputLabel>Select Playlist</InputLabel>
                <Select
                  value={selectedPlaylist || ""}
                  label="Select Playlist"
                  onChange={(e: SelectChangeEvent) =>
                    handlePlaylistSelect(e.target.value as string)
                  }
                >
                  {playlists.map((playlist) => (
                    <MenuItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={loadPrevPage}
                disabled={offset <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                endIcon={<NavigateNext />}
                onClick={loadNextPage}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </Box>
          </Box>

          {songs && offset >= 0 && !loading && (
            <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={deleteOldClips}
              >
                Delete Old Clips
              </Button>
              <Typography variant="body2" color="text.secondary">
                Click this button to delete clips from songs you remove from
                your playlist.
              </Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </Paper>

        {songs && (
          <Box sx={{ pb: 15 }}>
            {songs.map((song: Song, index: number) => (
              <Track
                key={`${song.track.uri}-${index}`}
                song={song}
                deviceID={deviceId}
                player={player}
                onClipEvent={() =>
                  fetchClips(
                    songs.map((s) => s.track.uri) // reuse current page URIs
                  )
                }
              />
            ))}
          </Box>
        )}

        <Player deviceID={deviceId} />
      </Container>
    </PlayerProvider>
  );
}

export default Playlists;
