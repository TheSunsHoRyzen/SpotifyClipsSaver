import dotenv from "dotenv";
import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
// Load the correct env file (development, production, etc.)
// console.log("cwd:", process.cwd());
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
console.log("Loading env from:", envFile);
dotenv.config({ path: envFile });
// Check that the env var exists
const encoded = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!encoded) {
    throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_B64 in environment");
}
// Decode and parse the service account JSON
const decoded = Buffer.from(encoded, "base64").toString("utf-8");
const credentials = JSON.parse(decoded);
// Initialize Firebase Admin
initializeApp({
    credential: admin.credential.cert(credentials),
});
const db = admin.firestore();
export { db };
