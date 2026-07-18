import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import documentRoutes from "./routes/document.routes";
// import aiRoutes from "./routes/ai.routes";
import chatRoutes from "./routes/chat.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/documents", documentRoutes);
// app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "NoteSage API running" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});