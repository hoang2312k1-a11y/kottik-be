import { body } from "express-validator";

export const registerValidator = [
  body("username").notEmpty().withMessage("Username là bắt buộc"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password tối thiểu 6 ký tự"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").notEmpty().withMessage("Password là bắt buộc"),
];
