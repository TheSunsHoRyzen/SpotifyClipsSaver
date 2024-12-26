import express from "express";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
const app = express();
app.use(express.json()); // Authentication routes
app.use(cors({ origin: "http://localhost:3000" }));
app.use("/auth", authRoutes);

app.listen(8080, () => {
  console.log(`Server running on port ${8080}`);
});
export default app;
