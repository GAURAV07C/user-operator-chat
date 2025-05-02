import { Schema, model } from "mongoose";

interface IMessage {
  roomId: string;
  senderId: string;
  message: string;
  role: string;
  type: "text" | "image";
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  role: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["text", "image"], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now },
});

const MessageModel = model<IMessage>("Message", MessageSchema);

export default MessageModel;
