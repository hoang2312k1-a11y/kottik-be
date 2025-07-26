import { Request, Response } from "express";
import Follow from "../models/Follow";
import { AuthRequest } from "../middleware/auth";
import { success, error } from "../utils/response";

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    if (req.userId === userId)
      return res.status(400).json(
        error("Không thể tự follow chính mình.", 400, {
          userId: ["Không thể tự follow chính mình."],
        }),
      );
    const exist = await Follow.findOne({ user: req.userId, following: userId });
    if (exist)
      return res.status(400).json(
        error("Đã follow người này.", 400, {
          userId: ["Đã follow người này."],
        }),
      );
    await Follow.create({ user: req.userId, following: userId });
    res.json(success(null, "Đã follow."));
  } catch {
    res.status(500).json(error("Lỗi follow.", 500));
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    await Follow.deleteOne({ user: req.userId, following: userId });
    res.json(success(null, "Đã unfollow."));
  } catch {
    res.status(500).json(error("Lỗi unfollow.", 500));
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const following = await Follow.find({ user: userId }).populate(
      "following",
      "username avatar",
    );
    res.json(
      success(
        following.map((f) => f.following),
        "Lấy danh sách following thành công!",
      ),
    );
  } catch {
    res.status(500).json(error("Lỗi lấy danh sách following.", 500));
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followers = await Follow.find({ following: userId }).populate(
      "user",
      "username avatar",
    );
    res.json(
      success(
        followers.map((f) => f.user),
        "Lấy danh sách followers thành công!",
      ),
    );
  } catch {
    res.status(500).json(error("Lỗi lấy danh sách followers.", 500));
  }
};
