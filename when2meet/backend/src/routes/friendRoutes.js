import express from "express";
import {
    getFriends,
    addFriend,
    removeFriend,
    acceptFriend,
    declineFriend,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all friends and friend requests
router.get("/", getFriends);

// Send friend request
router.post("/:userId", addFriend);

// Accept/decline friend request
router.put("/:userId/accept", acceptFriend);
router.put("/:userId/decline", declineFriend);

// Remove friend
router.delete("/:userId", removeFriend);

export default router;
