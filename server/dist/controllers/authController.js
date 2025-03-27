import { getAuthorizationUrl, exchangeToken, refreshToken, verifyUser, getUserClipData, } from "../services/spotifyService.js";
// Handle the /spotify-auth-url route to return the authorization URL
export const getAuthUrl = (req, res) => {
    // Add types for req and res
    const authUrl = getAuthorizationUrl();
    res.json({ url: authUrl });
};
// Handle the /spotify-token route to exchange the authorization code for tokens
export const exchangeAuthCode = async (req, res) => {
    // Add types for req and res
    // console.log("In exchange Auth Code!");
    const { code } = req.body; // Get code from body
    // const { state } = req.body.state;
    if (!code) {
        // console.log("no auth code provided");
        res.status(400).json({ error: "Authorization code is required" });
    }
    // if (!state) {
    //   console.log("no state provided!");
    //   res.status(400).json({ error: "state should be here" });
    // }
    try {
        const tokens = await exchangeToken(code); // Exchange the code for tokens
        res.json(tokens);
    }
    catch (error) {
        console.log("Error exchanging authorization code:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
};
// Optionally, keep your login and callback methods as well if they are being used.
export const login = (req, res) => {
    // Add types for req and res
    try {
        const authUrl = getAuthorizationUrl();
        res.redirect(authUrl);
    }
    catch (error) {
        console.log("Error generating Spotify Authorization URL:", error);
        res.status(500).send("Internal Server Error");
    }
};
export const callback = async (req, res) => {
    // Add types for req and res
    const code = req.query.code;
    // const state = req.query.state;
    if (!code) {
        res.status(400).json({ error: "Authorization code is missing" });
        return;
    }
    try {
        const data = await exchangeToken(code); // Type assertion for `code`
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Authentication failed", details: error });
    }
};
export const refresh = async (req, res) => {
    const { refreshtoken } = req.body;
    if (!refreshtoken) {
        console.log("no refresh token provided!");
        res.status(400).json({ error: "refresh token is required!" });
        return;
    }
    try {
        const tokens = await refreshToken(refreshtoken); // Pass the extracted token
        res.json(tokens); // Send tokens back to the client
    }
    catch (error) {
        console.log("Error acquiring refresh token:", error);
        res.status(500).json({ error: "Refresh failed" });
    }
};
export const getDB = async (req, res) => {
    const { auth_token, userID } = req.query;
    if (!auth_token || !userID) {
        res.status(400).json({ error: "Auth token and userID are required" });
        return;
    }
    try {
        // Verify the auth token and get the user's Spotify ID
        const spotifyUser = await verifyUser(auth_token);
        // Verify that the provided userID matches the Spotify user ID
        if (spotifyUser.id !== userID) {
            res.status(403).json({ error: "User ID mismatch" });
            return;
        }
        // Fetch mock data for the verified user
        const userData = await getUserClipData(userID);
        res.json({
            message: "success",
        });
    }
    catch (error) {
        console.error("Error in getDB:", error);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
};
// Create user data
export const createUserData = async (req, res) => {
    const { userID, data } = req.body;
    if (!userID || !data) {
        res.status(400).json({ error: "UserID and data are required" });
        return;
    }
    try {
        // Simulate creating user data
        console.log(`Creating data for user ${userID}:`, data);
        res.status(201).json({ message: "User data created successfully" });
    }
    catch (error) {
        console.error("Error creating user data:", error);
        res.status(500).json({ error: "Failed to create user data" });
    }
};
// Update user data
export const updateUserData = async (req, res) => {
    const { userID, data } = req.body;
    if (!userID || !data) {
        res.status(400).json({ error: "UserID and data are required" });
        return;
    }
    try {
        // Simulate updating user data
        console.log(`Updating data for user ${userID}:`, data);
        res.json({ message: "User data updated successfully" });
    }
    catch (error) {
        console.error("Error updating user data:", error);
        res.status(500).json({ error: "Failed to update user data" });
    }
};
// Delete user data
export const deleteUserData = async (req, res) => {
    const { userID } = req.body;
    if (!userID) {
        res.status(400).json({ error: "UserID is required" });
        return;
    }
    try {
        // Simulate deleting user data
        console.log(`Deleting data for user ${userID}`);
        res.json({ message: "User data deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting user data:", error);
        res.status(500).json({ error: "Failed to delete user data" });
    }
};
