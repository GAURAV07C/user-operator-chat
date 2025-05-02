import express from "express";
import authRoutes from "./authRoutes"; // Import auth routes
import Requestrouter from "./requestRoutes";
import chatRoutes from "./chatRoutes"; // Import chat routes
const router = express.Router();

// Use auth routes
router.use("/auth", authRoutes);
router.use("/request", Requestrouter);
router.use('/chat',chatRoutes); // Use chat routes

export default router;
