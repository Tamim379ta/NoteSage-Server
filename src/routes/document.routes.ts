import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getStats,
} from "../controllers/document.controller";

const router = Router();

router.post("/upload", requireAuth, upload.single("file"), uploadDocument);
router.get("/", requireAuth, getDocuments);
router.get("/:id", requireAuth, getDocument);
router.delete("/:id", requireAuth, deleteDocument);
router.get("/stats", requireAuth, getStats);

export default router;