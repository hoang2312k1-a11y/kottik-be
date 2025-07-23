import { Request, Response } from 'express';
import Video from '../models/Video';
import cloudinary from '../utils/cloudinary';
import { AuthRequest } from '../middleware/auth';
import Follow from '../models/Follow';
import { success, error } from '../utils/response';
import jwt from 'jsonwebtoken';

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json(error('Vui lòng chọn file video.', 400, { video: ['Vui lòng chọn file video.'] }));
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'tiktok_clone_videos',
    });
    const video = new Video({
      user: req.userId,
      url: result.secure_url,
      publicId: result.public_id,
      description: req.body.description,
      thumbnail: result.thumbnail_url || '',
    });
    await video.save();
    res.status(201).json(success(video, 'Upload video thành công!', 201));
  } catch {
    res.status(500).json(error('Lỗi upload video.', 500));
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    let videos;
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string };
        userId = decoded.userId;
      } catch {
        // ignore
      }
    }
    if (userId) {
      const following = await Follow.find({ user: userId }).select('following');
      const followingIds = following.map(f => f.following);
      if (followingIds.length > 0) {
        videos = await Video.find({ user: { $in: followingIds } })
          .sort({ createdAt: -1 })
          .populate('user', 'username avatar');
      } else {
        videos = await Video.find().sort({ createdAt: -1 }).populate('user', 'username avatar');
      }
    } else {
      videos = await Video.find().sort({ createdAt: -1 }).populate('user', 'username avatar');
    }
    res.json(success(videos, 'Lấy feed video thành công!'));
  } catch {
    res.status(500).json(error('Lỗi lấy feed.', 500));
  }
};

export const getUserVideos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const videos = await Video.find({ user: userId }).sort({ createdAt: -1 });
    res.json(success(videos, 'Lấy video của user thành công!'));
  } catch {
    res.status(500).json(error('Lỗi lấy video user.', 500));
  }
};
