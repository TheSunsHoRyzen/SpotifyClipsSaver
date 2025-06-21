import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./auth.js";
import spotifyRoutes from "./spotify.js";
import dbRoutes from "./db.js";
dotenv.config();

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
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: true, // Set to true if using HTTPS
      httpOnly: true,
      sameSite: "lax",
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
