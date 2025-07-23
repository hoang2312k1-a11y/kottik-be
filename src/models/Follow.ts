import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  user: mongoose.Types.ObjectId; // người theo dõi
  following: mongoose.Types.ObjectId; // người được theo dõi
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FollowSchema.index({ user: 1, following: 1 }, { unique: true });

export default mongoose.model<IFollow>("Follow", FollowSchema);
