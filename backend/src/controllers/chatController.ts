import { Request, Response } from "express";
import Chat from "../models/ChatMessage";

// Get all messages of a room based on role
export const getMessagesByRoom = async (req: Request, res: Response) : Promise<void> => {
  const { roomId } = req.params;
  const role = req.user?.role;
  const senderId = req.user?.id;

  if (!roomId) {
     res.status(400).json({ message: "Room ID is required" });
     return
  }

  try {
    let messages;

    if (role === "operator") {
      // Operators can view all messages in the room
      messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
    } else if (role === "user") {
      // Users can view only their own messages (or you can allow all if you want)
      messages = await Chat.find({ roomId }).sort({ createdAt: 1 });
      // If you want user-specific: .find({ roomId, senderId })
    } else {
      res.status(403).json({ message: "Unauthorized access" });
      return
    }

    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// Send message based on role
export const sendMessage = async (req: Request, res: Response) : Promise<void> => {
  const { roomId, message, imageUrl } = req.body;
  const senderId = req.user?.id;
  const role = req.user?.role;
  const io = req.io;

  if (!roomId) {
     res.status(400).json({ message: "Room ID is required" });
     return
  }

  let finalMessage = "";
  let type = "";

  if (imageUrl) {
    finalMessage = imageUrl;
    type = "image";
  } else if (message) {
    finalMessage = message;
    type = "text";
  } else {
     res
      .status(400)
      .json({ message: "Message or image URL is required" });
      return
  }

  try {
    const chat = await Chat.create({
      roomId,
      senderId,
      role,
      message: finalMessage,
      type,
    });

    // Emit new message to room
    io.to(roomId).emit("newMessage", {
      roomId,
      senderId,
      role,
      message: finalMessage,
      type,
      createdAt: chat.createdAt,
    });

    // Optionally auto-reply if operator sends text
    if (role === "operator" && message && type === "text") {
      const operatorResponse =
        "Thank you for your message. How can I assist you?";

      const operatorChat = await Chat.create({
        roomId,
        senderId: "operator",
        role: "operator",
        message: operatorResponse,
        type: "text",
      });

      io.to(roomId).emit("newMessage", {
        roomId,
        senderId: "operator",
        role: "operator",
        message: operatorResponse,
        type: "text",
        createdAt: operatorChat.createdAt,
      });
    }

    res.status(200).json({ message: "Message sent", chat });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};
