import { body, param } from "express-validator";

export const uploadVideoValidator = [
  body("description").optional().isString().withMessage("Mô tả phải là chuỗi"),
];

export const userIdParamValidator = [
  param("userId").isMongoId().withMessage("userId không hợp lệ"),
];
