import fetch from "node-fetch";
import "dotenv/config";
import { db } from "../firebase.js";
import { doc, updateDoc, getDoc, arrayUnion, } from "firebase/firestore";
const SPOTIFY_CLIENT_ID = String(process.env.CLIENT_ID);
const SPOTIFY_CLIENT_SECRET = String(process.env.CLIENT_SECRET);
const SPOTIFY_REDIRECT_URI = "http://localhost:3000/callback";
// const initState = generateRandomString(16);
export const getAuthorizationUrl = () => {
    const scopes = "user-read-private user-read-email streaming user-modify-playback-state user-read-playback-state app-remote-control";
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
export const exchangeToken = async (code) => {
    // console.log("Made it to exchange token!");
    // console.log("authorization code IN BACKEND " + code);
    // Construct Basic Authorization header
    const authHeader = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
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
            throw new Error(`Failed tokens: ${response.statusText}, Details: ${errorText}`);
        }
        // Parse and return JSON response
        return await response.json();
    }
    catch (error) {
        console.error("Error token exchange:", error);
        throw error;
    }
};
export const refreshToken = async (refresh_token) => {
    console.log("Made it to refresh token!");
    console.log("refresh token " + refresh_token + " IN BACKEND");
    // Construct Basic Authorization header
    const authHeader = `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
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
            throw new Error(`Failed in refreshToken: ${response.statusText}, Details: ${errorText}`);
        }
        // Parse and return JSON response
        return await response.json();
    }
    catch (error) {
        console.error("Error sending refresh token request!:", error);
        throw error;
    }
};
export const verifyUser = async (accessToken) => {
    const response = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to verify user: ${response.statusText}`);
    }
    const data = (await response.json());
    return { id: data.id };
};
// Mock database function
export const getUserClipData = async (userId, uri) => {
    try {
        const docRef = doc(db, userId, uri);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.error("Error getting document:", error);
    }
};
export const createUserClip = async (userID, uri, userData) => {
    try {
        const songDoc = doc(db, userID, uri);
        await updateDoc(songDoc, {
            times: arrayUnion(userData),
        });
    }
    catch (error) {
        console.error("Error adding document:", error);
    }
};
export const updateUser = async (userId, changes) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { changes });
        console.log("Document successfully updated!");
    }
    catch (error) {
        console.error("Error updating document:", error);
    }
};
