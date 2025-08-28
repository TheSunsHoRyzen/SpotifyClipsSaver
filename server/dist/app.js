import dotenv from "dotenv";
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
console.log(envFile);
dotenv.config({ path: ".env.development" });
const isProduction = process.env.NODE_ENV === "production";
import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./auth.js";
import spotifyRoutes from "./spotify.js";
import dbRoutes from "./db.js";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
const app = express();
const PORT = Number(process.env.PORT) || 3001;
app.set("trust proxy", 1); // required for secure cookies with proxy
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
async function main() {
    let sessionStore;
    if (isProduction) {
        const redisClient = createClient({
            url: process.env.REDIS_URL,
        });
        redisClient.on("error", (err) => {
            console.error("Redis error:", err);
        });
        await redisClient.connect();
        sessionStore = new RedisStore({ client: redisClient });
        await redisClient.ping().then(console.log).catch(console.error);
    }
    app.use(session({
        store: sessionStore, // undefined in dev, Redis in prod
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    }));
    app.use("/auth", authRoutes);
    app.use("/spotify", spotifyRoutes);
    app.use("/db", dbRoutes);
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
main().catch((err) => {
    console.error("App failed to start:", err);
});
