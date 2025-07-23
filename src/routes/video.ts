import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getFeed,
  getUserVideos,
} from "../controllers/videoController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  uploadVideoValidator,
  userIdParamValidator,
} from "../validators/video.validator";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  authenticate,
  upload.single("video"),
  uploadVideoValidator,
  validateRequest,
  uploadVideo,
);
router.get("/feed", getFeed);
router.get(
  "/user/:userId",
  userIdParamValidator,
  validateRequest,
  getUserVideos,
);

export default router;
