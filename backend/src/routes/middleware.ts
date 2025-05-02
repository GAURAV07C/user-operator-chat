import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
       io: Server; 
    }
  }
}

// Middleware to verify the token and attach user info to the request
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
 ) : Promise<void>  => {
  const token = req.header("Authorization")?.replace("Bearer ", ""); // Get the token 
  //from the Authorization header

  if (!token) {
    res
      .status(401)
      .json({ message: "Access denied. No token provided." });
    return Promise.resolve();
  }

  try {
    // Verify the token using a secret key (replace with your own secret)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY || "your_secret_key"
    ) as { id: string; email: string; role: string };

    // console.log(`User role: ${decoded.role}, email: ${decoded.email}, id: ${decoded.id}`);

    // Attach user data to the request object for later use
    req.user = decoded;

    next(); // Pass control to the next middleware or route handler
    return Promise.resolve();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
    return Promise.resolve();
  }
};

// Middleware to check if the user is an operator
export const isOperator = (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== "operator") {
    res
      .status(403)
      .json({ message: "You do not have permission to access this resource" });
    return Promise.resolve();
  }
  next();
  return Promise.resolve();
};

// Middleware to check if the user is a regular user
export const isUser = (req: Request, res: Response, next: NextFunction): Promise<void> => {

  if (!req.user || req.user.role !== "user") {
    res
      .status(403)
      .json({ message: "You do not have permission to access this resource" });
    return Promise.resolve();
  }
  next(); // Allow the request to proceed if the user is a regular user
  return Promise.resolve();
};
