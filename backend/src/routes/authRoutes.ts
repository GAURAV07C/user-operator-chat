import express from "express";
import { registerUser, loginUser } from "../controllers/authController";

const Authrouter = express.Router();

// User registration
Authrouter.post("/register", registerUser);

// User login
Authrouter.post("/login", loginUser);

export default Authrouter;
