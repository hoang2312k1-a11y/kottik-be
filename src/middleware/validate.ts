import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { error } from "../utils/response";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors: { [key: string]: string[] } = {};
    result.array().forEach((err) => {
      if ("param" in err) {
        const key = String(err.param);
        if (!errors[key]) errors[key] = [];
        errors[key].push(err.msg);
      }
    });
    return res.status(400).json(error("Dữ liệu không hợp lệ", 400, errors));
  }
  next();
};
