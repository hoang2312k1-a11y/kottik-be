import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  video: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  parent?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true },
);

export default mongoose.model<IComment>("Comment", CommentSchema);
