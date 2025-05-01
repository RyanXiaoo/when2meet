import { useState, useEffect } from "react";
import axios from "axios";

export default function FriendRequests() {
    const [friendRequests, setFriendRequests] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchFriendRequests();
    }, []);

    const fetchFriendRequests = async () => {
        try {
            const response = await axios.get("/friends/requests");
            setFriendRequests(response.data.friendRequests || []);
        } catch (error) {
            console.error(
                "Error fetching requests:",
                error.response?.data || error.message
            );
            setError("Failed to fetch friend requests");
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await axios.post(`/friends/accept/${requestId}`);
            setFriendRequests((prevRequests) =>
                prevRequests.filter((request) => request._id !== requestId)
            );
            setSuccess("Friend request accepted!");
        } catch (error) {
            console.error("Error accepting request:", error.response?.data);
            setError(
                error.response?.data?.message ||
                    "Failed to accept friend request"
            );
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            await axios.post(`/friends/decline/${requestId}`);
            setFriendRequests((prevRequests) =>
                prevRequests.filter((request) => request._id !== requestId)
            );
            setSuccess("Friend request declined!");
        } catch (error) {
            console.error("Error declining request:", error.response?.data);
            setError(
                error.response?.data?.message ||
                    "Failed to decline friend request"
            );
        }
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>

                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded">
                        {success}
                    </div>
                )}

                {friendRequests.length === 0 ? (
                    <p className="text-gray-400">No pending friend requests</p>
                ) : (
                    <ul className="space-y-3">
                        {friendRequests.map((request) => (
                            <li
                                key={request._id}
                                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">
                                        {request.from?.username || "Loading..."}
                                    </span>
                                    <span className="text-gray-400">
                                        {request.from?.email || ""}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        Received:{" "}
                                        {new Date(
                                            request.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() =>
                                            handleAcceptRequest(request._id)
                                        }
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeclineRequest(request._id)
                                        }
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
