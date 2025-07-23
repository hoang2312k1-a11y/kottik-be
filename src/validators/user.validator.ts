import { body, param } from "express-validator";

export const updateMeValidator = [
  body("username")
    .optional()
    .notEmpty()
    .withMessage("Username không được để trống"),
  // avatar không validate ở đây vì sẽ có route upload file riêng
];

export const userIdParamValidator = [
  param("id").isMongoId().withMessage("id user không hợp lệ"),
];

export const updatePasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Mật khẩu cũ là bắt buộc"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới tối thiểu 6 ký tự"),
];
