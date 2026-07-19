import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  uploadDocument,
  getPublicDocuments,
  getPublicDocument,
  getStats,
  getDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/document.controller";

const router = Router();

// ✅ Public routes FIRST — no requireAuth
router.get("/public", getPublicDocuments);
router.get("/public/:id", getPublicDocument);

// 🔒 Protected routes after
router.post("/upload", requireAuth, upload.single("file"), uploadDocument);
router.get("/stats", requireAuth, getStats);
router.get("/", requireAuth, getDocuments);
router.get("/:id", requireAuth, getDocument);
router.delete("/:id", requireAuth, deleteDocument);

export default router;