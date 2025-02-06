import React from 'react';
import { Song } from '../types/song';
import {checkToken} from '../checkToken';
type TrackProps = {
  song: Song;
};

function Track({ song }: TrackProps) {
    const playTrack = () => {
      if (localStorage.getItem('access_token')){
          const fetchToken = async () => {
          const accesstoken = await checkToken();
          if (accesstoken){
          console.log("access token received");
          }
       };
      fetchToken();
      fetch ("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                "Content-Type": "application/json"
            },
        body: JSON.stringify({
          position_ms: 0,
          uri: song.track.uri
        })
        }) 
          .catch((err) => {
          console.log(err.message);
          })
        }
    }
    const pauseTrack = () => {
        if (localStorage.getItem('access_token')){
            const fetchToken = async () => {
            const accesstoken = await checkToken();
            if (accesstoken){
            console.log("access token received");
            }
         };
        fetchToken();
        fetch ("https://api.spotify.com/v1/me/player/pause", {
          method: "PUT",
          headers: {
                  "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
              },
          }) 
            .catch((err) => {
            console.log(err.message);
            })
        }
    }
    return (
    <li key={song.track.id}>
        <div className="flex flex-col items-start p-4 ">
            <h3 className="">
                {song.track.name} by{' '}
            {song.track.artists.map((artist, index) => (
            <span key={index} className="font-bold">{artist.name}{index < song.track.artists.length - 1 ? ', ' : ''}</span>
            ))}
            </h3>
            <button className="text-green-500 hover:text-green-400 " onClick={playTrack}>Play</button>
            <button className="text-green-500 hover:text-green-400 " onClick={pauseTrack}>Pause</button>
      </div>
    </li>
  );
}

export default Track;
