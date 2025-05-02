import { Server, Socket } from "socket.io";
import { createChatRoom, sendMessage } from "../services/SocketServices"; // Import the service functions

export const socketController = (io: Server, socket: Socket) => {
  console.log("New client connected");

  // Join Room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
  });

  // Send Text Message
  socket.on("sendMessage", async ({ roomId, senderId, message, type }) => {
    try {
      // Use the service to send the message and save it in the database
      await sendMessage(socket, roomId, senderId, message, type);
      console.log(`Message sent and saved: ${message}`);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Typing Indicator
  socket.on("typing", ({ roomId, senderId }) => {
    socket.to(roomId).emit("userTyping", { senderId });
  });

  // Stop Typing Indicator
  socket.on("stopTyping", ({ roomId, senderId }) => {
    socket.to(roomId).emit("userStopTyping", { senderId });
  });

  // Create Chat Room
  socket.on("createRoom", ({ userId, operatorId }) => {
    const roomId = createChatRoom(socket, userId, operatorId);
    socket.emit("roomCreated", { roomId });
  });

  // Disconnect Event
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
};
