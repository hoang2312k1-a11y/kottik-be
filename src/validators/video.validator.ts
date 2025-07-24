import { body, param } from "express-validator";

export const uploadVideoValidator = [
  body("description").notEmpty().isString().withMessage("Mô tả là bắt buộc"),
];

export const userIdParamValidator = [
  param("userId").isMongoId().withMessage("userId không hợp lệ"),
];
