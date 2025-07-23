import { Request, Response } from "express";
import Comment from "../models/Comment";
import { AuthRequest } from "../middleware/auth";
import { success, error } from "../utils/response";
import { IComment } from '../models/Comment';

// Thêm comment hoặc reply
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { videoId, content, parent } = req.body;
    const comment = await Comment.create({
      video: videoId,
      user: req.userId,
      content,
      parent: parent || null,
    });
    res.status(201).json(success(comment, "Thêm comment thành công!", 201));
  } catch {
    res.status(500).json(error("Lỗi khi thêm comment.", 500));
  }
};

// Lấy danh sách comment dạng cây (nested) cho video
export const getComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const comments = await Comment.find({ video: videoId })
      .populate("user", "username avatar")
      .sort({ createdAt: 1 })
      .lean();
    // Xây dựng cây comment
    type CommentNode = Partial<IComment> & { replies: CommentNode[] };
    const map: Record<string, CommentNode> = {};
    comments.forEach((c) => (map[String(c._id)] = { ...c, replies: [] }));
    const tree: CommentNode[] = [];
    comments.forEach((c) => {
      if (c.parent) {
        map[String(c.parent)]?.replies.push(map[String(c._id)]);
      } else {
        tree.push(map[String(c._id)]);
      }
    });
    res.json(success(tree, "Lấy danh sách comment thành công!"));
  } catch {
    res.status(500).json(error("Lỗi khi lấy comment.", 500));
  }
};

// Sửa comment
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await Comment.findById(id);
    if (!comment)
      return res.status(404).json(error("Không tìm thấy comment.", 404));
    if (comment.user.toString() !== req.userId)
      return res
        .status(403)
        .json(error("Không có quyền sửa comment này.", 403));
    comment.content = content;
    await comment.save();
    res.json(success(comment, "Sửa comment thành công!"));
  } catch {
    res.status(500).json(error("Lỗi khi sửa comment.", 500));
  }
};

// Xoá comment và các reply con
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return res.status(404).json(error("Không tìm thấy comment.", 404));
    if (comment.user.toString() !== req.userId)
      return res
        .status(403)
        .json(error("Không có quyền xoá comment này.", 403));
    await deleteCommentAndReplies(id);
    res.json(success(null, "Đã xoá comment!"));
  } catch {
    res.status(500).json(error("Lỗi khi xoá comment.", 500));
  }
};

// Hàm xoá đệ quy
async function deleteCommentAndReplies(commentId: string) {
  const replies = await Comment.find({ parent: commentId });
  for (const reply of replies) {
    await deleteCommentAndReplies(String(reply._id));
  }
  await Comment.findByIdAndDelete(commentId);
}
