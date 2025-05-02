import { Socket, Server } from "socket.io";
import MessageModel from "../models/ChatMessage"; // Assuming you have a MessageModel for saving chat messages
import RequestModel from "../models/Request"; // Fixed typo here

// Create a new chat room
export const createChatRoom = (
  socket: Socket,
  userId: string,
  operatorId: string
) => {
  const roomId = `${userId}-${operatorId}`;

  // Check if the request is still accepted or expired before creating room
  RequestModel.findOne(
    { userId, status: "accepted" },
    (err: any, request: { status: string }) => {
      if (err || !request || request.status === "expired") {
        console.log(`Cannot create room for expired request: ${userId}`);
        socket.emit("error", {
          message: "This request has expired or doesn't exist anymore.",
        });
        return;
      }

      socket.join(roomId); // Join the socket to the chat room
      console.log(`User ${userId} joined the room ${roomId}`);
      socket.emit("roomCreated", { roomId });
    }
  );

  return `${userId}-${operatorId}`; // return roomId
};

// Send a message in the chat room
export const sendMessage = async (
  socket: Socket,
  roomId: string,
  senderId: string,
  role: string, // Role (user/operator)
  message: string,
  type: "text" | "image"
) => {
  try {
    // Validate message content
    if (!message && !type) {
      socket.emit("error", { message: "Message content is required" });
      return;
    }

    // Save the message to MongoDB
    const newMessage = new MessageModel({
      roomId,
      senderId,
      role,
      message,
      type,
      timestamp: new Date(),
    });

    await newMessage.save();

    // Emit the message to everyone in the chat room
    socket.to(roomId).emit("newMessage", {
      senderId,
      role,
      message,
      type,
      timestamp: new Date(),
    });

    // Optional: Emit to the sender for acknowledgment
    socket.emit("messageSent", {
      roomId,
      senderId,
      role,
      message,
      type,
      timestamp: new Date(),
    });

    console.log("Message sent to room: ", roomId);
  } catch (error) {
    console.error("Error saving or sending message: ", error);
    socket.emit("error", { message: "Error sending message" });
  }
};

// Event handler for when a user connects
export const socketController = (io: Server, socket: Socket) => {
  console.log("A user connected!");

  // Example: Handling 'createRoom' event from the client-side
  socket.on("createRoom", (userId: string, operatorId: string) => {
    const roomId = createChatRoom(socket, userId, operatorId);
    // Emit room creation confirmation to the client
    socket.emit("roomCreated", { roomId });
  });

  // Example: Handling 'sendMessage' event from the client-side
  socket.on(
    "sendMessage",
    async (
      roomId: string,
      senderId: string,
      role: string, // Added role (user/operator)
      message: string,
      type: "text" | "image"
    ) => {
      await sendMessage(socket, roomId, senderId, role, message, type);
    }
  );

  // Listen for disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};
