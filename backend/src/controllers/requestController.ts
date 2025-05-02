import { Request, Response } from "express";
import RequestModel from "../models/Request";
import { Server } from "socket.io";
import { createChatRoom } from "../services/SocketServices";
import User from "../models/User";

// Create request
export const createRequest = async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = req.user?.id;

  try {
    const request = new RequestModel({
      userId,
      message,
      status: "pending",
      operatorNotified: [],
    });

    await request.save();

    const connectedOperatorIds = Array.from(
      req.io.sockets.adapter.rooms.get("operators") || []
    );

    request.operatorNotified = connectedOperatorIds;
    await request.save();

    req.io.to("operators").emit("new_request", request);

    res.status(201).json({ message: "Request created", request });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// Get all pending requests for operators
export const getRequests = async (req: Request, res: Response) => {
  try {
    expireRequests(req.io); // Call expireRequests to check for expired requests

    // Fetch all pending requests from the database
    const requests = await RequestModel.find({ status: "pending" }).populate(
      "userId",
      "email",
      User
    );

    // Emit the 'pendingRequests' event to all connected clients (can be filtered to specific users if needed)
    req.io.emit("new_request", requests);

    res.status(200).json(requests); // Send the current list of requests as the response
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// Accept request by operator
export const acceptRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const operatorId = req.user?.id;
  const io = req.io;

  if (!operatorId)
    return res.status(400).json({ message: "Operator ID is undefined" });

  try {
    // Fetch the request from the database
    const request = await RequestModel.findById(requestId);
    if (!request) return res.status(400).json({ message: "Request not found" });

    if (request.status === "expired")
      return res.status(400).json({ message: "Request has already expired" });

    console.log("Before update - Request status:", request.status); // Log the initial status

    // Check if a request for this user has already been accepted
    const existingRequest = await RequestModel.findOne({
      userId: request.userId,
      status: "accepted",
      acceptedBy: { $ne: null },
    });

    if (existingRequest) {
      const roomId = `${existingRequest.userId}-${existingRequest.acceptedBy}`;
      io.emit("redirectToRoom", { roomId, userId: request.userId });
      return res.status(200).json({
        message: "Request already accepted, redirecting to existing chat room",
        roomId,
      });
    }

    // Update request status to 'accepted'
    request.status = "accepted";
    request.acceptedBy = operatorId;

    // Use findOneAndUpdate to ensure immediate update
    const updatedRequest = await RequestModel.findOneAndUpdate(
      { _id: requestId },
      { status: "accepted", acceptedBy: operatorId },
      { new: true } // Return the updated document
    );

    // Log the updated request status
    console.log("After update - Request status:", updatedRequest?.status); // Should log 'accepted'

    // Fetch the request again from the database to confirm the status change
    const confirmedRequest = await RequestModel.findById(requestId);
    console.log("Confirmed updated request:", confirmedRequest); // Confirm the update was persisted

    const operatorSocket = io.sockets.sockets.get(operatorId);
    if (!operatorSocket)
      return res.status(400).json({ message: "Operator socket not found" });

    // Create chat room and notify both user and operator
    const roomId = createChatRoom(operatorSocket, request.userId, operatorId);
    console.log("Created Room ID:", roomId); // Verify room creation

    io.to(`user-${request.userId}`).emit("chatRoomCreated", {
      roomId,
      operatorId,
    });
    io.to(`operator-${operatorId}`).emit("chatRoomCreated", {
      roomId,
      operatorId,
    });

    res
      .status(200)
      .json({ message: "Request accepted and new chat room created", roomId });
  } catch (error) {
    console.error("Error:", error); // Additional logging for error tracking
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// Check request status for user
export const checkRequestStatus = async (req: Request, res: Response) => {
  const { requestId } = req.params;

  try {
    const request = await RequestModel.findById(requestId);
    if (!request) return res.status(400).json({ message: "Request not found" });

    if (request.status === "accepted" && request.acceptedBy) {
      const roomId = `${request.userId}-${request.acceptedBy}`;
      return res.status(200).json({
        message: "Request accepted, redirecting to chat room",
        roomId,
      });
    }

    if (request.status === "pending")
      return res
        .status(200)
        .json({ message: "Request not yet accepted, still pending" });

    if (request.status === "expired")
      return res.status(200).json({ message: "Request has expired" });

    res.status(200).json({ message: "Unknown status" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// Expire pending requests
export const expireRequests = async (io: Server) => {
  try {
    const pendingRequests = await RequestModel.find({ status: "pending" });
    const now = new Date();

    for (const request of pendingRequests) {
      const timeDiff = now.getTime() - request.createdAt.getTime();
      if (timeDiff > 120000) {
        request.status = "expired";
        await request.save();

        io.to(`user-${request.userId}`).emit("requestExpired", {
          userId: request.userId,
          requestId: request._id,
          message: "Your request has expired.",
        });

        console.log(`Request expired: ${request._id}`);
      }
    }
  } catch (error) {
    console.error("Error expiring requests:", (error as Error).message);
  }
};

// Function to start expiring requests every 2 seconds (should be called from server.ts)
export const startRequestExpiryChecker = (io: Server) => {
  setInterval(() => {
    expireRequests(io);
  }, 2000);
};
