import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ message: "AI routes placeholder" });
});

export default router;
