import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import videoRoutes from "./routes/video";
import followRoutes from "./routes/follow";
import commentRoutes from "./routes/comment";
import morgan from 'morgan';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/tiktok_clone";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Kết nối MongoDB thành công!"))
  .catch((err) => console.error("Kết nối MongoDB thất bại:", err));

// Tạo thư mục logs nếu chưa có
if (!fs.existsSync(path.join(__dirname, '../logs'))) {
  fs.mkdirSync(path.join(__dirname, '../logs'));
}
// Morgan log request ra file và console
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("TikTok Clone API is running!");
});

// Log lỗi hệ thống
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error((err as Error).stack || err);
  res.status(500).json({ code: 500, success: false, message: 'Lỗi server nội bộ', errors: undefined });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
