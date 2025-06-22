import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./auth.js";
import spotifyRoutes from "./spotify.js";
import dbRoutes from "./db.js";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

dotenv.config();

//is production
const isProduction = process.env.NODE_ENV === "production";

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", function (err) {
  throw err;
});
await client.connect();

const redisStore = new RedisStore({
  client: client,
});

client.ping().then(console.log).catch(console.error);

const app = express();
const PORT = 10000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(
  session({
    store: isProduction ? redisStore : undefined,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Set to true if using HTTPS
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/spotify", spotifyRoutes);
app.use("/db", dbRoutes);

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
