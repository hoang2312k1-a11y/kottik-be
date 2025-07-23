import express from "express";
import { register, login } from "../controllers/authController";
import { validateRequest } from "../middleware/validate";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);

export default router;
