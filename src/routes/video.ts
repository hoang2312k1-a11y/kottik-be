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
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  authenticate,
  upload.single("video"),
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
