import { Request, Response } from "express";
import User from "../models/User";
import Video from "../models/Video";

export const searchAll = async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q)
    return res.json({
      code: 200,
      success: true,
      data: { users: [], videos: [] },
      message: "OK",
    });
  const [users, videos] = await Promise.all([
    User.find({ username: { $regex: q, $options: "i" } })
      .limit(5)
      .select("_id username avatar"),
    Video.find({ description: { $regex: q, $options: "i" } })
      .limit(20)
      .populate("user", "username avatar"),
  ]);
  res.json({
    code: 200,
    success: true,
    data: { users, videos },
    message: "OK",
  });
};

export const searchUsers = async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q)
    return res.json({ code: 200, success: true, data: [], message: "OK" });
  const users = await User.find({ username: { $regex: q, $options: "i" } })
    .limit(5)
    .select("_id username avatar");
  res.json({ code: 200, success: true, data: users, message: "OK" });
};

export const searchVideos = async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q)
    return res.json({ code: 200, success: true, data: [], message: "OK" });
  const videos = await Video.find({ description: { $regex: q, $options: "i" } })
    .limit(20)
    .populate("user", "username avatar");
  res.json({ code: 200, success: true, data: videos, message: "OK" });
};

export const getTrendingKeywords = async (req: Request, res: Response) => {
  try {
    // Lấy các từ khóa phổ biến từ video descriptions
    const videos = await Video.find({ description: { $exists: true, $ne: "" } })
      .select("description")
      .limit(100);

    // Tách từ khóa từ descriptions
    const keywords =
      videos
        .map((v) => v.description)
        .join(" ")
        .toLowerCase()
        .match(/\b\w+\b/g) || [];

    // Đếm tần suất và lấy top keywords
    const keywordCount = keywords.reduce(
      (acc, keyword) => {
        if (keyword.length > 2) {
          // Bỏ qua từ quá ngắn
          acc[keyword] = (acc[keyword] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const trendingKeywords = Object.entries(keywordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword]) => keyword);

    res.json({
      code: 200,
      success: true,
      data: trendingKeywords,
      message: "OK",
    });
  } catch {
    res
      .status(500)
      .json({ code: 500, success: false, message: "Lỗi server", data: [] });
  }
};
