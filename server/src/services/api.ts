// export const fetchUserData = async (accessToken: string) => {
//   const response = await fetch("https://api.spotify.com/v1/me", {
//     method: "GET",
//     headers: { Authorization: `Bearer ${accessToken}` },
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to fetch user data: ${response.statusText}`);
//   }

//   const data = await response.json();
//   console.log(data);
//   return data;
// };

// export const getToken = async (code: string): Promise<string> => {
//   const SPOTIFY_CLIENT_ID = "d5695b7e4d344ab6abe136e567451ed1";
//   const CLIENT_SECRET = "27289aa5ed0f4806884e60added73296";
//   const redirectUri = "http://localhost:5173/callback";
//   const url = "https://accounts.spotify.com/api/token";

//   const payload = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: new URLSearchParams({
//       grant_type: "authorization_code",
//       code,
//       redirect_uri: redirectUri,
//       client_id: SPOTIFY_CLIENT_ID,
//       client_secret: CLIENT_SECRET,
//     }).toString(),
//   };

//   const response = await fetch(url, payload);

//   if (!response.ok) {
//     throw new Error(`${response.statusText} + "HERE`);
//   }

//   const data = await response.json();
//   return data.access_token;
// };

export const fetchSpotifyTokens = async (code: string) => {
  const response = await fetch(
    `http://localhost:8080/auth/callback?code=${code}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.statusText}`);
  }
  return await response.json();
};
