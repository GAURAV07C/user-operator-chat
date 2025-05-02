import express from "express";
import http from "http";
import routers from "./routes/index";
import cors from "cors";
import { Server } from "socket.io";
import path from "path";
import connectDB from "./config/database";
import { socketController } from "./controllers/socketController"; // Import your socketController
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000", // Use environment variable for the frontend URL
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Create the socket.io server and set up cors for WebSockets
const io = new Server(server, {
  cors: {
    origin:  "http://localhost:3000", // Replace with the correct frontend address
    methods: ["GET", "POST", "PUT"],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", routers); // Import your API routes

// Connect to the database
connectDB()
  .then(() => {
    console.log("Database connected successfully");

    // Start the server on the specified port
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit if the database connection fails
  });

// Socket.io event handling (moved to controller for better structure)
io.on("connection", (socket) => {
  console.log("New client connected");

  // Call the socket controller to handle various events
  socketController(io, socket);

  // Listen for disconnections
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Test Route
app.get("/", (req, res) => {
  res.send("Helpdesk API running...");
});

// Graceful shutdown for clean server stop
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0); // Exit process
  });
});
