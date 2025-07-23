import { body, param } from "express-validator";

export const addCommentValidator = [
  body("videoId").isMongoId().withMessage("videoId không hợp lệ"),
  body("content").notEmpty().withMessage("Nội dung không được để trống"),
  body("parent").optional().isMongoId().withMessage("parent không hợp lệ"),
];

export const commentIdParamValidator = [
  param("id").isMongoId().withMessage("id comment không hợp lệ"),
];

export const getCommentsValidator = [
  param("videoId").isMongoId().withMessage("videoId không hợp lệ"),
];
