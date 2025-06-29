import express from "express";
import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
// 1. Redirect to Spotify login
router.get("/login", (req, res) => {
    const scope = "user-read-private user-read-email playlist-modify-public user-modify-playback-state user-read-playback-state user-read-currently-playing streaming";
    const queryParams = querystring.stringify({
        response_type: "code",
        client_id: clientId,
        scope,
        redirect_uri: redirectUri,
    });
    res.redirect(`${SPOTIFY_AUTH_URL}?${queryParams}`);
});
// 2. Callback handler
router.get("/callback", async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post(SPOTIFY_TOKEN_URL, querystring.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        }), {
            headers: {
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const { access_token, refresh_token, expires_in } = response.data;
        // Save tokens in session
        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;
        req.session.expiresAt = Date.now() + expires_in * 1000;
        // console.log(req.session.accessToken + " IN AUTH");
        res.redirect(process.env.FRONTEND_URL); // Or send a success response
    }
    catch (error) {
        console.error("Token exchange failed", error);
        res.status(500).send("Auth failed");
    }
});
const authRoutes = router;
export default authRoutes;
