import express from "express";
import {
  createRequest,
  getRequests,
  acceptRequest,
  checkRequestStatus, // Import the new controller method
} from "../controllers/requestController";
import { verifyToken, isUser, isOperator } from "./middleware";

const Requestrouter = express.Router();

// Create request by user
Requestrouter.post("/create", verifyToken, isUser, createRequest);

// Get all requests for operators
Requestrouter.get("/requests", verifyToken, isOperator, getRequests);

// Accept request by operator
Requestrouter.put("/accept/:requestId", verifyToken, isOperator, acceptRequest);

// Check request status and redirect to room if accepted
Requestrouter.get(
  "/check-status/:requestId",
  verifyToken,
  isUser,
  checkRequestStatus
); // New route for checking status

export default Requestrouter;
