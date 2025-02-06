export {};

// import React, { useState, useEffect } from 'react';
// import {checkToken} from '../checkToken';

// const WebPlayback = () => {
//     const [player, setPlayer] = useState<Spotify.Player | null>(null);

//     useEffect(() => {
//         const fetchTokenAndInitialize = async () => {
//             if (localStorage.getItem('access_token')) {
//                 const accessToken = await checkToken();
//                 if (accessToken) {
//                     console.log('Access token received:', accessToken);
//                 }
//             }

//             const script = document.createElement('script');
//             script.src = 'https://sdk.scdn.co/spotify-player.js';
//             script.async = true;

//             document.body.appendChild(script);

//             window.onSpotifyWebPlaybackSDKReady = () => {
//                 const playerInstance = new window.Spotify.Player({
//                     name: 'Web Playback SDK',
//                     getOAuthToken: (cb: (token: string) => void) => {
//                         cb(String(localStorage.getItem("access_token")));
//                     },
//                     volume: 0.5,
//                 });

//                 setPlayer(playerInstance);

//                 playerInstance.addListener('ready', ({ device_id }) => {
//                     console.log('Ready with Device ID', device_id);
//                 });

//                 playerInstance.addListener('not_ready', ({ device_id }) => {
//                     console.log('Device ID has gone offline', device_id);
//                 });

//                 playerInstance.connect();
//             };
//         };

//         fetchTokenAndInitialize();

//         return () => {
//             if (player) {
//                 player.disconnect();
//             }
//         };
//     }, [player]);
//     return (
//         <>
//             <div className="container">
//                 <div className="main-wrapper"></div>
//             </div>
//         </>
//     );
// };

// export default WebPlayback;
