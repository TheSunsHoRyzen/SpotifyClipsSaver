import React, { useCallback, useEffect, useState } from "react";

import Track from "../components/Track";
import { Song } from "../types/song";
import Player from "../components/Player";
import { PlayerProvider } from "../context/PlayerContext";
declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (callback: (token: string | null) => void) => void;
        volume: number;
      }) => any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface Playlist {
  id: string;
  name: string;
  // Add other playlist properties as needed
}

function Playlists() {
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [songs, setSongs] = useState<Song[]>([]); // previously Object[]
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // code from spotify to create player
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "Spotify Clip Saver",
        getOAuthToken: (cb: (token: string | null) => void) => {
          // Fetch token from backend
          fetch("http://localhost:8080/spotify/player-token", {
            credentials: "include",
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to get player token");
              }
              return response.json();
            })
            .then((data) => {
              cb(data.access_token);
            })
            .catch((error) => {
              console.error("Error getting player token:", error);
              cb(null);
            });
        },
        volume: 1,
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

      spotifyPlayer.addListener(
        "player_state_changed",
        (state: {
          paused: boolean;
          duration: number;
          track_window: {
            current_track: {
              name: string;
            } | null;
          };
        }) => {
          if (!state) return;
        }
      );

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // fetch all of the clips from the database and save them to local Song type.
  const fetchClips = useCallback(() => {
    if (!selectedPlaylist) {
      return;
    }

    setLoading(true);

    // Fetch songs and merge with clips
    Promise.all([
      fetch(
        `http://localhost:8080/spotify/playlist/${selectedPlaylist}/tracks?offset=${offset}&limit=${limit}`,
        {
          credentials: "include",
        }
      ).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Could not get available playlists songs ${response.statusText}`
          );
        }
        return response.json();
      }),
      fetch("http://localhost:8080/db/getClips", {
        credentials: "include",
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch clips");
        }

        return response.json();
      }),
    ])
      .then(([allSongs, allClips]) => {
        setTotal(allSongs.total);
        const songsWithClips = allSongs.items.map((song: Song) => {
          const songUri = song.track.uri;
          // Get clips for this song from the clips object
          const songClips = allClips[songUri] || {
            startTimes: [],
            endTimes: [],
            ids: [],
          };

          // Ensure startTimes and endTimes are arrays
          const startTimes = Array.isArray(songClips.startTimes)
            ? songClips.startTimes
            : [];
          const endTimes = Array.isArray(songClips.endTimes)
            ? songClips.endTimes
            : [];
          const ids = Array.isArray(songClips.ids) ? songClips.ids : [];

          // Make sure arrays have the same length
          const minLength = Math.min(startTimes.length, endTimes.length);
          const normalizedStartTimes = startTimes.slice(0, minLength);
          const normalizedEndTimes = endTimes.slice(0, minLength);

          return {
            ...song,
            clips: {
              startTimes: normalizedStartTimes,
              endTimes: normalizedEndTimes,
              ids: ids,
            },
          };
        });
        setSongs(songsWithClips);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err.message);
        setLoading(false);
      });
  }, [selectedPlaylist, offset]);
  useEffect(() => {
    fetchClips();
  }, [selectedPlaylist, offset, fetchClips]);

  // Fetch user's public playlists
  useEffect(() => {
    fetch("http://localhost:8080/spotify/v1/me/playlists/", {
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
        console.log(err.message);
      });
  }, []);

  const limit = 20;

  const findPlaylistByName = (name: string) => {
    return playlists.find((playlist: Playlist) => playlist.name === name);
  };
  // once user selects playlist, find that playlist in the playlists of Playlist objects
  const handlePlaylistSelect = (playlistName: string) => {
    const playlist = findPlaylistByName(playlistName);
    if (playlist) {
      setSelectedPlaylist(playlist.id);
      setOffset(0);
      setSongs([]);
    }
  };
  // load next page
  const loadNextPage = () => {
    setOffset((prevOffset) =>
      prevOffset + limit <= total ? prevOffset + limit : prevOffset
    );
  };
  // load previous page
  const loadPrevPage = () => {
    setOffset((prevOffset) =>
      prevOffset - limit > 0 ? prevOffset - limit : 0
    );
  };

  return (
    <PlayerProvider>
      <div>
        <h1 className="flex justify-center items-center text-2xl">
          Spotify Playlists
        </h1>
        {/* Dropdown for Playlists */}
        <div className="flex flex-col items-start gap-4 p-4">
          <label className="text-lg font-semibold">
            Choose a playlist from your library:
          </label>
          <select
            className="border-2 rounded-md border-green-500/100 p-2"
            onChange={(e) => handlePlaylistSelect(e.target.value)}
          >
            <option value="">--Please choose an option--</option>
            {playlists.map((singlePlaylist: Playlist) => (
              <option key={singlePlaylist.id} value={singlePlaylist.name}>
                {singlePlaylist.name}
              </option>
            ))}
          </select>

          {/* Pagination */}
          <div className="flex items-center gap-4 mt-4">
            {songs && offset > 0 && !loading && (
              <button
                className="bg-green-500 p-2 rounded text-white hover:bg-green-600"
                onClick={loadPrevPage}
              >
                ← Prev Page
              </button>
            )}
            {songs && offset + limit < total && !loading && (
              <button
                className="bg-green-500 p-2 rounded text-white hover:bg-green-600"
                onClick={loadNextPage}
              >
                Next Page →
              </button>
            )}
          </div>
        </div>

        {songs && (
          <div>
            <ul>
              {(songs as Song[]).map((song: Song) => (
                <Track
                  song={song}
                  deviceID={deviceId}
                  player={player}
                  onClipEvent={fetchClips}
                />
              ))}
            </ul>
          </div>
        )}
        {loading && <p>Loading...</p>}
        <Player deviceID={deviceId} />
      </div>
    </PlayerProvider>
  );
}
export default Playlists;

//   1. one collection which has one document

//   document -> {
//     clips: {
//       "song uri": {
//         startTimes: []
//         endTimes: []
//       }
//     }
//   }

//   2.

//   download the "clips" object from firbease

//   a. you go through each song (by looping through the keys)
//   b. match song uri with current songs that you have stored in-memory on the client
//   c. modify it -> add the clips information from the firebase to that specific song

// backend/database
// "spotify:track:6rqhFgbbKwnb9MLmUQDhG6": {
//   startTimes: [34,34],
//   endTimes: [4594,40]
// }

// 1. get from spotify
// "spotify:track:6rqhFgbbKwnb9MLmUQDhG6": {
//   ...songmetadata
//   clips: {
//     startTimes: [],
//     endTimes: []
//   }
// }

// 2. add the clips from database
// clips {

// }

// "spotify:track:6rqhFgbbKwnb9MLmUQDhG6": {
//   ...songmetadata
//   clips: {
//     startTimes: [],
//     endTimes: []
//   }
// }

// 3. then we have the full thing
// 4.

// frontend:
// "spotify:track:6rqhFgbbKwnb9MLmUQDhG6": {
//   ...songmetadata
//   clips: {
//     startTimes: [34,34],
//     endTimes: [4594,40]
//   }
// }

// console.log(songs["spotify:track:6rqhFgbbKwnb9MLmUQDh56"].clips.startTime[0]);
