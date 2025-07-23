import { body, param } from "express-validator";

export const followUserValidator = [
  body("userId").isMongoId().withMessage("userId không hợp lệ"),
];

export const userIdParamValidator = [
  param("userId").isMongoId().withMessage("userId không hợp lệ"),
];
