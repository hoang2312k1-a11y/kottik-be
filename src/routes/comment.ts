import express from "express";
import {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import {
  addCommentValidator,
  commentIdParamValidator,
  getCommentsValidator,
} from "../validators/comment.validator";

const router = express.Router();

router.post(
  "/",
  authenticate,
  addCommentValidator,
  validateRequest,
  addComment,
);
router.get("/:videoId", getCommentsValidator, validateRequest, getComments);
router.patch(
  "/:id",
  authenticate,
  commentIdParamValidator,
  validateRequest,
  updateComment,
);
router.delete(
  "/:id",
  authenticate,
  commentIdParamValidator,
  validateRequest,
  deleteComment,
);

export default router;
