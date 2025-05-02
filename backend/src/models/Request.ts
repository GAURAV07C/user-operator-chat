import { Schema, model, Document } from "mongoose";

interface IRequest extends Document {
  userId: string;
  message: string;
  status: "pending" | "accepted" | "expired";
  acceptedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  operatorNotified: string[];
}

const requestSchema = new Schema<IRequest>(
  {
    userId: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    acceptedBy: { type: String, default: null },
    operatorNotified: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Request = model<IRequest>("Request", requestSchema);

export default Request;
