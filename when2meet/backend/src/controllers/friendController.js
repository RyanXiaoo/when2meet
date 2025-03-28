import User from "../models/User.js";

// @desc    Get user's friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("friends", "name email")
            .populate("friendRequests", "name email");

        res.json({
            friends: user.friends,
            friendRequests: user.friendRequests,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send friend request
// @route   POST /api/friends/:friendId
// @access  Private
export const addFriend = async (req, res) => {
    try {
        const { friendId } = req.params;

        // Check if friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already friends
        if (friend.friends.includes(req.user.id)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check if friend request already sent
        if (friend.friendRequests.includes(req.user.id)) {
            return res
                .status(400)
                .json({ message: "Friend request already sent" });
        }

        // Add friend request
        friend.friendRequests.push(req.user.id);
        await friend.save();

        res.json({ message: "Friend request sent" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept friend request
// @route   PUT /api/friends/:friendId/accept
// @access  Private
export const acceptFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const user = await User.findById(req.user.id);

        // Check if friend request exists
        if (!user.friendRequests.includes(friendId)) {
            return res
                .status(400)
                .json({ message: "No friend request from this user" });
        }

        // Add to friends list
        user.friends.push(friendId);
        user.friendRequests = user.friendRequests.filter(
            (id) => id.toString() !== friendId
        );
        await user.save();

        // Add current user to friend's friends list
        const friend = await User.findById(friendId);
        friend.friends.push(req.user.id);
        await friend.save();

        res.json({ message: "Friend request accepted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Decline friend request
// @route   PUT /api/friends/:friendId/decline
// @access  Private
export const declineFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const user = await User.findById(req.user.id);

        // Remove from friend requests
        user.friendRequests = user.friendRequests.filter(
            (id) => id.toString() !== friendId
        );
        await user.save();

        res.json({ message: "Friend request declined" });
    } catch (error) {
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

        // Remove from friends list
        user.friends = user.friends.filter((id) => id.toString() !== friendId);
        await user.save();

        // Remove current user from friend's friends list
        const friend = await User.findById(friendId);
        friend.friends = friend.friends.filter(
            (id) => id.toString() !== req.user.id
        );
        await friend.save();

        res.json({ message: "Friend removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
