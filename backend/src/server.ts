import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.send("API LIVE");
});

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server Running on port", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("DB Connection Failed: ", (err as Error).message);
    process.exit(1);
  });
