import fetch from "node-fetch";
const SPOTIFY_CLIENT_ID = "d5695b7e4d344ab6abe136e567451ed1";
const SPOTIFY_CLIENT_SECRET = "27289aa5ed0f4806884e60added73296";
const SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";

const generateRandomString = (length: number) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// const initState = generateRandomString(16);
export const getAuthorizationUrl = (): string => {
  const scopes = "user-read-private user-read-email streaming user-modify-playback-state user-read-playback-state";
  // console.log(`spotify client id: ${SPOTIFY_CLIENT_ID}`);

  const query = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    // state: initState,
  }).toString();
  return `https://accounts.spotify.com/authorize?${query}`;
};

// export const exchangeToken = async (
//   code: string,
//   state: string
// ): Promise<unknown> => {
//   console.log("made it to exchange token!");
//   const response = await fetch("https://accounts.spotify.com/api/token", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//       Authorization:
//         "Basic" +
//         new Buffer.from(
//           SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET
//         ).toString("base64"),
//     },
//     body: new URLSearchParams({
//       grant_type: "authorization_code",
//       code,
//       redirect_uri: SPOTIFY_REDIRECT_URI,
//     }).toString(),
//   });
//   if (!response.ok) {
//     throw new Error(`Failed to exchange token: ${response.statusText}`);
//   }
//   return await response.json();
// };
export const exchangeToken = async (code: string): Promise<unknown> => {
  console.log("Made it to exchange token!");
  console.log("authorization code IN BACKEND " + code);
  // Construct Basic Authorization header
  const authHeader = `Basic ${Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64")}`;

  // Use URLSearchParams for the body
  const body = new URLSearchParams({
    // response_type: "code",
    grant_type: "authorization_code",
    code: code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });

  try {
    // Make the POST request to Spotify's token endpoint
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: body.toString(), // Serialize URLSearchParams to string
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text(); // Get error details
      throw new Error(
        `Failed tokens: ${response.statusText}, Details: ${errorText}`
      );
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    console.error("Error token exchange:", error);
    throw error;
  }
};

export const refreshToken = async (refresh_token: string): Promise<unknown> => {
  console.log("Made it to refresh token!");
  console.log("refresh token " + refresh_token + " IN BACKEND");
  // Construct Basic Authorization header
  const authHeader = `Basic ${Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64")}`;

  // Use URLSearchParams for the body
  const body = new URLSearchParams({
    // response_type: "code",
    grant_type: "refresh_token",
    refresh_token: refresh_token,
  });

  try {
    // Make the POST request to Spotify's token endpoint
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: body.toString(), // Serialize URLSearchParams to string
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text(); // Get error details
      throw new Error(
        `Failed in refreshToken: ${response.statusText}, Details: ${errorText}`
      );
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    console.error("Error sending refresh token request!:", error);
    throw error;
  }
};
