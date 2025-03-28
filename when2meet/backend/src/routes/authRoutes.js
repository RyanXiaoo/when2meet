import express from "express";
import {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
    passwordResetLimiter,
    forgotPasswordLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password/:resetToken", passwordResetLimiter, resetPassword);

// Protected routes
router.use(protect); // All routes after this will be protected
router.post("/logout", logout);

export default router;
