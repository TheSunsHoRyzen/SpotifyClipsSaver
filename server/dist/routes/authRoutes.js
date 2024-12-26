import { Router } from "express";
import { getAuthUrl, exchangeAuthCode, login, callback, refresh, } from "../controllers/authController.js";
const router = Router();
router.get("/spotify-auth-url", getAuthUrl);
// Route to exchange the authorization code for tokens
router.post("/spotify-token", exchangeAuthCode);
router.post("/refresh-token", refresh);
// Other routes for login and callback
router.get("/login", login);
router.get("/callback", callback);
export default router;
