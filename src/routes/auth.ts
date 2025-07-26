import express from "express";
import { register, login, logout } from "../controllers/authController";
import { validateRequest } from "../middleware/validate";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.post("/logout", logout);

export default router;
