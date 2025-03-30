import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Get user's friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate(
            "friends",
            "username email"
        );

        res.json({
            friends: user.friends,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's received friend requests
// @route   GET /api/friends/requests
// @access  Private
export const getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: "friendRequests",
            populate: {
                path: "from",
                select: "username email",
            },
        });

        res.json({
            friendRequests: user.friendRequests,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's sent friend requests
// @route   GET /api/friends/requests/sent
// @access  Private
export const getSentFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: "sentFriendRequests.to",
            select: "username email",
        });

        console.log("Sent requests from DB:", user.sentFriendRequests); // Debug log
        res.json({
            sentRequests: user.sentFriendRequests,
        });
    } catch (error) {
        console.error("Error in getSentFriendRequests:", error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
export const addFriend = async (req, res) => {
    try {
        const { email } = req.body;

        // Input validation
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Get current user
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found" });
        }

        // Can't add yourself
        if (currentUser.email === email) {
            return res
                .status(400)
                .json({ message: "You cannot add yourself as a friend" });
        }

        // Find the user to add
        const friendToAdd = await User.findOne({ email });
        if (!friendToAdd) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (currentUser.friends.includes(friendToAdd._id)) {
            return res
                .status(400)
                .json({ message: "Already friends with this user" });
        }

        // Check if friend request already exists
        const existingRequest = currentUser.sentFriendRequests.find(
            (request) => request.to.toString() === friendToAdd._id.toString()
        );
        if (existingRequest) {
            return res
                .status(400)
                .json({ message: "Friend request already sent" });
        }

        // Check if there's a pending request from the other user
        const pendingRequest = currentUser.friendRequests.find(
            (request) => request.from.toString() === friendToAdd._id.toString()
        );
        if (pendingRequest) {
            return res.status(400).json({
                message: "This user has already sent you a friend request",
            });
        }

        // Create friend request
        const friendRequest = {
            _id: new mongoose.Types.ObjectId(),
            from: currentUser._id,
            to: friendToAdd._id,
            createdAt: new Date(),
        };

        // Add request to both users
        currentUser.sentFriendRequests.push(friendRequest);
        friendToAdd.friendRequests.push(friendRequest);

        // Save both users
        await Promise.all([currentUser.save(), friendToAdd.save()]);

        // Return success response
        res.status(200).json({
            message: "Friend request sent successfully",
            request: {
                id: friendRequest._id,
                to: {
                    id: friendToAdd._id,
                    username: friendToAdd.username,
                    email: friendToAdd.email,
                },
                createdAt: friendRequest.createdAt,
            },
        });
    } catch (error) {
        console.error("Error in addFriend:", error);
        res.status(500).json({
            message: "Failed to send friend request",
            error: error.message,
        });
    }
};

// @desc    Cancel sent friend request
// @route   DELETE /api/friends/request/:requestId
// @access  Private
export const cancelFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const sender = await User.findById(req.user.id);

        console.log("Attempting to cancel request:", requestId); // Debug log
        console.log("Current sent requests:", sender.sentFriendRequests); // Debug log

        // Find the sent request index
        const sentRequestIndex = sender.sentFriendRequests.findIndex(
            (request) => request._id.toString() === requestId
        );

        if (sentRequestIndex === -1) {
            return res
                .status(404)
                .json({ message: "Friend request not found" });
        }

        // Get the request before removing it
        const sentRequest = sender.sentFriendRequests[sentRequestIndex];
        console.log("Found request to cancel:", sentRequest); // Debug log

        // Find recipient
        const recipient = await User.findById(sentRequest.to);
        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Remove request from recipient's received requests
        recipient.friendRequests = recipient.friendRequests.filter(
            (request) => request.from.toString() !== sender._id.toString()
        );

        // Remove from sender's sent requests
        sender.sentFriendRequests.splice(sentRequestIndex, 1);

        // Save both users
        await Promise.all([sender.save(), recipient.save()]);

        console.log(
            "After cancellation - sender requests:",
            sender.sentFriendRequests
        ); // Debug log

        res.json({ message: "Friend request cancelled successfully" });
    } catch (error) {
        console.error("Error in cancelFriendRequest:", error); // Debug log
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept/:requestId
// @access  Private
export const acceptFriend = async (req, res) => {
    try {
        const { requestId } = req.params;
        const user = await User.findById(req.user.id);

        // Find the friend request
        const requestIndex = user.friendRequests.findIndex(
            (request) => request._id.toString() === requestId
        );

        if (requestIndex === -1) {
            return res
                .status(404)
                .json({ message: "Friend request not found" });
        }

        const friendRequest = user.friendRequests[requestIndex];
        const friendId = friendRequest.from;

        // Find the friend who sent the request
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        // Add each other as friends (if not already friends)
        if (!user.friends.includes(friendId)) {
            user.friends.push(friendId);
        }
        if (!friend.friends.includes(user._id)) {
            friend.friends.push(user._id);
        }

        // Remove the friend request from recipient
        user.friendRequests.splice(requestIndex, 1);

        // Remove from sender's sent requests
        friend.sentFriendRequests = friend.sentFriendRequests.filter(
            (request) => request.to.toString() !== user._id.toString()
        );

        // Save both users
        await Promise.all([user.save(), friend.save()]);

        res.json({
            message: "Friend request accepted",
            friend: {
                _id: friend._id,
                username: friend.username,
                email: friend.email,
            },
        });
    } catch (error) {
        console.error("Error in acceptFriend:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Decline friend request
// @route   POST /api/friends/decline/:requestId
// @access  Private
export const declineFriend = async (req, res) => {
    try {
        const { requestId } = req.params;
        const user = await User.findById(req.user.id);

        // Find the friend request
        const requestIndex = user.friendRequests.findIndex(
            (request) => request._id.toString() === requestId
        );

        if (requestIndex === -1) {
            return res
                .status(404)
                .json({ message: "Friend request not found" });
        }

        const friendRequest = user.friendRequests[requestIndex];
        const friendId = friendRequest.from;

        // Find the friend who sent the request
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        // Remove the friend request from recipient
        user.friendRequests.splice(requestIndex, 1);

        // Remove from sender's sent requests
        friend.sentFriendRequests = friend.sentFriendRequests.filter(
            (request) => request.to.toString() !== user._id.toString()
        );

        // Save both users
        await Promise.all([user.save(), friend.save()]);

        res.json({ message: "Friend request declined" });
    } catch (error) {
        console.error("Error in declineFriend:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const user = await User.findById(req.user.id);

        // Check if the friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        // Remove friend from user's friends list
        user.friends = user.friends.filter(
            (id) => id.toString() !== friendId.toString()
        );

        // Remove user from friend's friends list
        friend.friends = friend.friends.filter(
            (id) => id.toString() !== user._id.toString()
        );

        // Save both users
        await Promise.all([user.save(), friend.save()]);

        res.json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error in removeFriend:", error);
        res.status(500).json({ message: error.message });
    }
};
