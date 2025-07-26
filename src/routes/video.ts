import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getFeed,
  getUserVideos,
  getFeedFollowing,
  likeVideo,
} from "../controllers/videoController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  uploadVideoValidator,
  userIdParamValidator,
} from "../validators/video.validator";

const router = express.Router();
const memoryUpload = multer({ storage: multer.memoryStorage(),limits: { fileSize: 100 * 1024 * 1024 } });

router.post(
  "/upload",
  authenticate,
  memoryUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  uploadVideoValidator,
  validateRequest,
  uploadVideo,
);
router.post(
  "/:id/like",
  authenticate,
  likeVideo,
);
router.get("/feed", getFeed);
router.get(
  "/feed/following",
  authenticate,
  getFeedFollowing,
);
router.get(
  "/user/:userId",
  userIdParamValidator,
  validateRequest,
  getUserVideos,
);

export default router;
