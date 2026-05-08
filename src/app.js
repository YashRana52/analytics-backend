import express from "express";
import cors from "cors";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Analytics backend is running");
});

// Analytics routes
app.use("/api/analytics", analyticsRoutes);

export default app;
