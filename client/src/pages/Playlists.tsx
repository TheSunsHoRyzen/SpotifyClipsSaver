import React, { useEffect, useState } from "react";
import { checkToken } from "../checkToken";
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
interface Clip {
  id: string;
  start: number;
  end: number;
}

interface Clips {
  [uri: string]: {
    [id: string]: Clip;
  };
}

// [
//   c1 <--- you know that the person is clicking on the first index of the array
//   c2
//   c3
// ]

// new array -> override the whole thing

// [
//   c1'
//   c2
//   c3
// ]

function Playlists() {
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Object[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [songs, setSongs] = useState<Object[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [player, setPlayer] = useState<any>(null);
  // const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  // const [currentTrack, setCurrentTrack] = useState("");

  const limit = 20;
  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      const fetchToken = async () => {
        const accesstoken = await checkToken();
        if (accesstoken) {
          console.log("access token received");
        }
      };
      fetchToken();
      fetch("https://api.spotify.com/v1/me/playlists/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
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
    }
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (localStorage.getItem("access_token")) {
        const fetchToken = async () => {
          const accesstoken = await checkToken();
          if (accesstoken) {
            console.log("YAY!");
          }
        };
        fetchToken();
      }
      const spotifyPlayer = new window.Spotify.Player({
        name: "Spotify Clip Saver",
        getOAuthToken: (cb: (token: string | null) => void) => {
          cb(localStorage.getItem("access_token"));
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
          setIsPaused(state.paused);
          // if (state.track_window.current_track) {
          //   setCurrentTrack(state.track_window.current_track.name);
          // }
        }
      );

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!selectedPlaylist) {
      return;
    }
    if (localStorage.getItem("access_token")) {
      const fetchToken = async () => {
        const accesstoken = await checkToken();
        if (accesstoken) {
          console.log("access token received");
        }
      };
      fetchToken();
      setLoading(true);

      // Fetch all clips
      const fetchAllClips = async () => {
        try {
          const response = await fetch("http://localhost:8080/clips");
          if (!response.ok) {
            throw new Error("Failed to fetch clips");
          }
          return await response.json();
        } catch (error) {
          console.error("Error fetching clips:", error);
          return {};
        }
      };

      // Fetch songs and merge with clips
      Promise.all([
        fetch(
          `https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks?offset=${offset}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        ).then((response) => {
          if (!response.ok) {
            throw new Error(
              `Could not get available playlists ${response.statusText}`
            );
          }
          return response.json();
        }),
        fetchAllClips(),
      ])
        .then(([allSongs, allClips]) => {
          setTotal(allSongs.total);
          const songsWithClips = allSongs.items.map((song: Song) => {
            const songUri = song.track.uri;
            const clips = allClips[songUri] || { startTimes: [], endTimes: [] };
            return { ...song, clips };
          });
          setSongs(songsWithClips);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err.message);
          setLoading(false);
        });
    }
  }, [selectedPlaylist, offset]);

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
            onChange={(e) => {
              setSelectedPlaylist(e.target.value);
              setOffset(0);
              setSongs([]);
            }}
          >
            <option value="">--Please choose an option--</option>
            {playlists.map((singlePlaylist: any) => (
              <option key={singlePlaylist.id} value={singlePlaylist.id}>
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
                <Track song={song} deviceID={deviceId} player={player} />
              ))}
            </ul>
          </div>
        )}

        {/* {playlists ? (
          <pre>{JSON.stringify(playlists, null, 2)}</pre> // Display playlists as formatted JSON
        ) : (
          <p>Loading playlists...</p>
        )} */}
        {loading && <p>Loading...</p>}
        <Player />
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
