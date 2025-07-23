import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { success, error } from "../utils/response";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dziqpah14/image/upload/v1753281314/Sample_User_Icon_epwud4.png";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    res.json(success(user, "Lấy thông tin user thành công!"));
  } catch {
    res.status(500).json(error("Lỗi server.", 500));
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { username, avatar } },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    res.json(success(user, "Cập nhật thông tin thành công!"));
  } catch {
    res.status(500).json(error("Lỗi server.", 500));
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json(
          error("Mật khẩu cũ không đúng.", 400, {
            oldPassword: ["Mật khẩu cũ không đúng."],
          }),
        );
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json(success(null, "Đổi mật khẩu thành công!"));
  } catch {
    res.status(500).json(error("Lỗi đổi mật khẩu.", 500));
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json(
          error("Vui lòng chọn file avatar.", 400, {
            avatar: ["Vui lòng chọn file avatar."],
          }),
        );
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "tiktok_clone_avatars",
      resource_type: "image",
    });
    await User.findByIdAndUpdate(
      req.userId,
      { avatar: result.secure_url },
      { new: true },
    );
    res.json(
      success({ avatar: result.secure_url }, "Cập nhật avatar thành công!"),
    );
  } catch {
    res.status(500).json(error("Lỗi upload avatar.", 500));
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    res.json(success(user, "Lấy thông tin user thành công!"));
  } catch {
    res.status(500).json(error("Lỗi server.", 500));
  }
};

// Sửa hàm register để set avatar mặc định nếu không truyền lên
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, avatar } = req.body;
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
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || DEFAULT_AVATAR,
    });
    await user.save();
    return res.status(201).json(success(null, "Đăng ký thành công!", 201));
  } catch {
    return res.status(500).json(error('Lỗi server.', 500));
  }
};
