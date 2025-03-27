import { Router } from "express";
import { getAuthUrl, exchangeAuthCode, login, callback, refresh, getDB, createUserData, updateUserData, deleteUserData, } from "../controllers/authController.js";
const router = Router();
router.get("/spotify-auth-url", getAuthUrl);
// Route to exchange the authorization code for tokens
router.post("/spotify-token", exchangeAuthCode);
router.post("/refresh-token", refresh);
// Other routes for login and callback
router.get("/login", login);
router.get("/callback", callback);
// CRUD routes for user data
router.get("/db", getDB); // get
router.post("/user-data", createUserData); // Create
router.put("/user-data", updateUserData); // Update
router.delete("/user-data", deleteUserData); // Delete
export default router;
