import express from "express";
import {
    getFriends,
    getFriendRequests,
    getSentFriendRequests,
    addFriend,
    cancelFriendRequest,
    acceptFriend,
    declineFriend,
    removeFriend,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.use(protect);

router.route("/").get(getFriends);
router.route("/requests").get(getFriendRequests);
router.route("/requests/sent").get(getSentFriendRequests);
router.route("/request").post(addFriend);
router.route("/request/:requestId").delete(cancelFriendRequest);
router.route("/accept/:requestId").post(acceptFriend);
router.route("/decline/:requestId").post(declineFriend);
router.route("/remove/:friendId").delete(removeFriend);

export default router;
