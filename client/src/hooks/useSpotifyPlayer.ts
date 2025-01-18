import { useEffect, useState, useRef } from 'react';

export const useSpotifyPlayer = (accessToken: string) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new Spotify.Player({
        name: 'Spotify Web Player',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      spotifyPlayer.connect();
    };

    return () => {
      player?.disconnect();
    };
  }, [accessToken]);

  return { player, isReady };
};
