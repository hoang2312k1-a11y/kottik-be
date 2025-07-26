import { Request, Response } from "express";
import User from "../models/User";
import Follow from "../models/Follow";
import { AuthRequest } from "../middleware/auth";
import { success, error } from "../utils/response";
import bcrypt from "bcryptjs";
import { uploadWithRetry } from "../utils/cloudinary";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dziqpah14/image/upload/fl_preserve_transparency/v1753281314/Sample_User_Icon_epwud4.jpg?_s=public-apps';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    
    // Lấy số lượng followers và followings
    const followersCount = await Follow.countDocuments({ following: req.userId });
    const followingsCount = await Follow.countDocuments({ user: req.userId });
    
    const userData = {
      ...user.toObject(),
      followers: followersCount,
      followings: followingsCount,
      isFollowed: false // Không thể follow chính mình
    };
    
    res.json(success(userData, "Lấy thông tin user thành công!"));
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
  let cloudinaryResult: any = null;
  
  // Tạo timestamp cho request này
  const requestTimestamp = Date.now();
  
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json(error("Vui lòng chọn file avatar.", 400));
    }
    
    cloudinaryResult = await uploadWithRetry(file, 'tiktok_clone_avatars', 'image');
    
    // Kiểm tra nếu response đã được gửi hoặc connection đã đóng
    if (res.headersSent || res.finished) {
      console.log('Response already sent, ignoring upload result');
      return;
    }
    
    // Lấy thông tin user hiện tại để so sánh timestamp
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json(error("Không tìm thấy user.", 404));
    }
    
    // Nếu user đã có avatar mới hơn (timestamp lớn hơn), bỏ qua upload này
    if (currentUser.avatarUpdatedAt && currentUser.avatarUpdatedAt > requestTimestamp) {
      console.log('Newer avatar already uploaded, ignoring this upload');
      // Xóa avatar vừa upload vì không dùng
      if (cloudinaryResult?.public_id) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id, { resource_type: 'image' });
        } catch (destroyErr) {
          console.error('Error destroying unused avatar:', destroyErr);
        }
      }
      return;
    }
    
    // Cập nhật avatar với timestamp
    await User.findByIdAndUpdate(req.userId, { 
      avatar: cloudinaryResult?.secure_url,
      avatarUpdatedAt: requestTimestamp
    }, { new: true });
    
    res.json(success({ avatar: cloudinaryResult?.secure_url }, "Cập nhật avatar thành công!"));
    
  } catch (err: any) {
    console.error('Avatar upload failed:', err);
    
    // Kiểm tra nếu response đã được gửi hoặc connection đã đóng
    if (res.headersSent || res.finished) {
      console.log('Response already sent, ignoring error');
      return;
    }
    
    // Cleanup nếu có lỗi
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id, { resource_type: 'image' });
      } catch (destroyErr) {
        console.error('Error destroying avatar on error:', destroyErr);
      }
    }
    
    return res.status(500).json(error("Lỗi upload avatar: " + err.message, 500));
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json(error("Không tìm thấy user.", 404));
    
    // Lấy số lượng followers và followings
    const followersCount = await Follow.countDocuments({ following: id });
    const followingsCount = await Follow.countDocuments({ user: id });
    
    // Kiểm tra user hiện tại có follow user này không
    let isFollowed = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string };
        const currentUserId = decoded.userId;
        if (currentUserId !== id) {
          const followDoc = await Follow.findOne({ user: currentUserId, following: id });
          isFollowed = !!followDoc;
        }
      } catch {
        // ignore jwt error
      }
    }
    
    const userData = {
      ...user.toObject(),
      followers: followersCount,
      followings: followingsCount,
      isFollowed
    };
    
    res.json(success(userData, "Lấy thông tin user thành công!"));
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
