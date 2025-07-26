import { Request, Response } from "express";
import Video from "../models/Video";
import { AuthRequest } from "../middleware/auth";
import { success, error } from "../utils/response";
import { uploadWithRetry } from "../utils/cloudinary";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Follow from "../models/Follow";

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  let cloudinaryResult: any = null;
  let thumbnailResult: any = null;
  
  // Tạo timestamp cho request này
  const requestTimestamp = Date.now();
  
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const file = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];
    
    if (file) {
      console.log('buffer length:', file.buffer?.length);
    }
    if (!file) return res.status(400).json(error('Vui lòng chọn file video.', 400, { video: ['Vui lòng chọn file video.'] }));
    
    // Upload song song video và thumbnail (nếu có)
    const uploadPromises = [
      uploadWithRetry(file, 'tiktok_clone_videos', 'video')
    ];
    
    if (thumbnailFile) {
      uploadPromises.push(uploadWithRetry(thumbnailFile, 'tiktok_clone_thumbnails', 'image'));
    }
    
    const results = await Promise.all(uploadPromises);
    
    cloudinaryResult = results[0];
    if (thumbnailFile) {
      thumbnailResult = results[1];
    }
    
    // Kiểm tra nếu response đã được gửi hoặc connection đã đóng
    if (res.headersSent || res.finished) {
      console.log('Response already sent, ignoring video upload result');
      return;
    }
    
    let thumbnailUrl = thumbnailResult?.secure_url || '';
    
    // Nếu không có thumbnail từ client, tạo từ video
    if (!thumbnailUrl && cloudinaryResult?.secure_url) {
      try {
        // Sử dụng Cloudinary transformation để tạo thumbnail từ video
        const publicId = cloudinaryResult.public_id;
        
        // Tạo thumbnail URL với transformation
        thumbnailUrl = cloudinary.url(publicId, {
          resource_type: 'video',
          transformation: [
            { width: 400, height: 600, crop: 'fill', gravity: 'center' },
            { start_offset: '0', duration: '1' }, // Lấy frame đầu tiên
            { format: 'jpg', quality: 'auto' }
          ]
        });
      } catch (thumbnailErr) {
        console.error('Thumbnail generation error:', thumbnailErr);
        thumbnailUrl = cloudinaryResult?.thumbnail_url || '';
      }
    }
    
    const video = new Video({
      user: req.userId,
      url: cloudinaryResult?.secure_url,
      publicId: cloudinaryResult?.public_id,
      description: req.body.description,
      thumbnail: thumbnailUrl || cloudinaryResult?.thumbnail_url || '',
      uploadTimestamp: requestTimestamp,
    });
    await video.save();
    res.status(201).json(success(video, 'Upload video thành công!', 201));
    
  } catch (err: any) {
    console.error('Upload failed:', err);
    
    // Kiểm tra nếu response đã được gửi hoặc connection đã đóng
    if (res.headersSent || res.finished) {
      console.log('Response already sent, ignoring video upload error');
      return;
    }
    
    // Cleanup nếu có lỗi
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id, { resource_type: 'video' });
      } catch (destroyErr) {
        console.error('Error destroying video on error:', destroyErr);
      }
    }
    if (thumbnailResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(thumbnailResult.public_id, { resource_type: 'image' });
      } catch (destroyErr) {
        console.error('Error destroying thumbnail on error:', destroyErr);
      }
    }
    
    return res.status(500).json(error('Lỗi upload video: ' + err.message, 500));
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    let videos;
    let userId = null;
    let followingIds: string[] = [];
    const authHeader = req.headers.authorization;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;
    let total = 0;
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
      followingIds = following.map((f: any) => f.following);
      if (followingIds.length > 0) {
        total = await Video.countDocuments({ user: { $in: followingIds } });
        videos = await Video.find({ user: { $in: followingIds } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'username avatar');
      } else {
        total = await Video.countDocuments();
        videos = await Video.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'username avatar');
      }
    } else {
      total = await Video.countDocuments();
      videos = await Video.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'username avatar');
    }

    // Thêm thông tin isFollowed và liked cho từng video
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const followingMap = new Set(followingIds.map((id: string) => id.toString()));
      videos = videos.map((video: any) => {
        const videoObj = video.toObject();
        videoObj.user.isFollowed = followingMap.has(videoObj.user._id.toString());
        videoObj.liked = videoObj.likedBy.some((id: any) => id.equals(userObjectId));
        return videoObj;
      });
    }
    const hasMore = skip + videos.length < total;
    res.json(success({ videos, hasMore, total }, 'Lấy feed video thành công!'));
  } catch {
    res.status(500).json(error('Lỗi lấy feed.', 500));
  }
};

export const getUserVideos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const videos = await Video.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar');
    res.json(success(videos, 'Lấy video của user thành công!'));
  } catch {
    res.status(500).json(error('Lỗi lấy video user.', 500));
  }
};

export const getFeedFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;
    const following = await Follow.find({ user: userId }).select('following');
    const followingIds = following.map((f: any) => f.following);
    if (followingIds.length === 0) {
      return res.json(success({ videos: [], hasMore: false, total: 0 }, 'Bạn chưa theo dõi ai.'));
    }
    const total = await Video.countDocuments({ user: { $in: followingIds } });
    let videos = await Video.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar');

    // Thêm thông tin isFollowed và liked cho từng video
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const followingMap = new Set(followingIds.map((id: string) => id.toString()));
    videos = videos.map((video: any) => {
      const videoObj = video.toObject();
      videoObj.user.isFollowed = followingMap.has(videoObj.user._id.toString());
      videoObj.liked = videoObj.likedBy.some((id: any) => id.equals(userObjectId));
      return videoObj;
    });
    const hasMore = skip + videos.length < total;
    res.json(success({ videos, hasMore, total }, 'Lấy video following thành công!'));
  } catch {
    res.status(500).json(error('Lỗi lấy video following.', 500));
  }
};

export const likeVideo = async (req: AuthRequest, res: Response) => {
  try {
    const videoId = req.params.id;
    const userId = req.userId;
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json(error('Video không tồn tại.', 404));
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const liked = video.likedBy.some((id) => id.equals(userObjectId));
    if (liked) {
      video.likedBy = video.likedBy.filter((id) => !id.equals(userObjectId));
      video.likes = Math.max(0, video.likes - 1);
    } else {
      video.likedBy.push(userObjectId);
      video.likes += 1;
    }
    await video.save();
    res.json(success({ likes: video.likes, liked: !liked }, liked ? 'Đã bỏ like.' : 'Đã like.'));
  } catch {
    res.status(500).json(error('Lỗi like video.', 500));
  }
};
