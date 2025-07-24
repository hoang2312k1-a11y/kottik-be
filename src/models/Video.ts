import mongoose, { Document, Schema } from "mongoose";

export interface IVideo extends Document {
  user: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
}

const VideoSchema = new Schema<IVideo>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IVideo>("Video", VideoSchema);
