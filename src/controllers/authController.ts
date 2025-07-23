import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { success, error } from "../utils/response";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json(
          error("Email hoặc username đã tồn tại.", 400, {
            email: ["Email hoặc username đã tồn tại."],
          }),
        );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    return res.status(201).json(success(null, "Đăng ký thành công!", 201));
  } catch {
    return res.status(500).json(error('Lỗi server.', 500));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json(
          error("Email hoặc mật khẩu không đúng.", 400, {
            email: ["Email hoặc mật khẩu không đúng."],
          }),
        );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json(
          error("Email hoặc mật khẩu không đúng.", 400, {
            password: ["Email hoặc mật khẩu không đúng."],
          }),
        );
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json(
      success(
        {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
        },
        "Đăng nhập thành công!",
      ),
    );
  } catch {
    return res.status(500).json(error('Lỗi server.', 500));
  }
};
