import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any; // Existing user object from auth middleware
      file?: any; // Multer file
    }
  }
}
