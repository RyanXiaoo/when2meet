import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        // Check for token in headers
        if (!req.headers.authorization?.startsWith("Bearer")) {
            return res
                .status(401)
                .json({ message: "Not authorized, no token" });
        }

        // Get token from header
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ message: "Not authorized, no token" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        // Get user from token
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Set user in request
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", {
            error: error.message,
            stack: error.stack,
        });
        return res.status(401).json({
            message: "Not authorized",
            error: error.message,
        });
    }
};
