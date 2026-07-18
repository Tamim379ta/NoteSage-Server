import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  sendMessage,
  getSessions,
  getSession,
  deleteSession,
} from "../controllers/chat.controller";

const router = Router();

router.post("/send", requireAuth, sendMessage);
router.get("/sessions", requireAuth, getSessions);
router.get("/sessions/:id", requireAuth, getSession);
router.delete("/sessions/:id", requireAuth, deleteSession);

export default router;