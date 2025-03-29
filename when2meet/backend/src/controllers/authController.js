import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { validatePassword } from "../utils/passwordValidator.js";

// Generate JWT with dynamic expiration
const generateToken = (id, rememberMe = false) => {
    const expiresIn = rememberMe ? "30d" : "24h";
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn,
    });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate password
        const { isValid, errors } = validatePassword(password);
        if (!isValid) {
            return res
                .status(400)
                .json({ message: "Invalid password", errors });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select("+password");
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id, rememberMe),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
    try {
        // Since we're using JWT, we just need to tell the client to remove the token
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Set expire
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Send reset email
        const host = `${req.protocol}://${req.get("host")}`;
        const emailSent = await sendPasswordResetEmail(email, resetToken, host);

        if (!emailSent) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }

        res.json({
            message: "Password reset email sent",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { resetToken } = req.params;

        // Validate new password
        const { isValid, errors } = validatePassword(password);
        if (!isValid) {
            return res
                .status(400)
                .json({ message: "Invalid password", errors });
        }

        // Get hashed token
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid or expired reset token" });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({
            message: "Password reset successful",
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
