import express from "express";
import {
  getMe,
  updateMe,
  getUserProfile,
  updatePassword,
  uploadAvatar,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  updateMeValidator,
  userIdParamValidator,
} from "../validators/user.validator";
import multer from "multer";
import { updatePasswordValidator } from "../validators/user.validator";

const memoryUpload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMeValidator, validateRequest, updateMe);
router.patch(
  "/me/password",
  authenticate,
  updatePasswordValidator,
  validateRequest,
  updatePassword,
);
router.post(
  "/me/avatar",
  authenticate,
  memoryUpload.single("avatar"),
  uploadAvatar,
);
router.get("/:id", userIdParamValidator, validateRequest, getUserProfile);

export default router;
