import express from "express";
import { getMessagesByRoom, sendMessage } from "../controllers/chatController";
import { verifyToken } from "./middleware";

const router = express.Router();

router.get("/:roomId", getMessagesByRoom);

// Send message (text or image both)
router.post("/send", verifyToken, sendMessage);
export default router;
