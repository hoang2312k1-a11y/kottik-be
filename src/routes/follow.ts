import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
} from "../controllers/followController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  followUserValidator,
  userIdParamValidator,
} from "../validators/follow.validator";

const router = express.Router();

router.post(
  "/follow",
  authenticate,
  followUserValidator,
  validateRequest,
  followUser,
);
router.post(
  "/unfollow",
  authenticate,
  followUserValidator,
  validateRequest,
  unfollowUser,
);
router.get(
  "/following/:userId",
  userIdParamValidator,
  validateRequest,
  getFollowing,
);
router.get(
  "/followers/:userId",
  userIdParamValidator,
  validateRequest,
  getFollowers,
);

export default router;
