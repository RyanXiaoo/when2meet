import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.interceptors.request.use((config) => {
    const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default function Dashboard() {
    const { user } = useAuth();
    const [friendEmail, setFriendEmail] = useState("");
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch friends and friend requests
    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
        fetchSentRequests();
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await axios.get("/friends");
            setFriends(response.data.friends || []);
        } catch (error) {
            console.error(
                "Error fetching friends:",
                error.response?.data || error.message
            );
            setError("Failed to fetch friends");
        }
    };

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

    const fetchSentRequests = async () => {
        try {
            const response = await axios.get("/friends/requests/sent");
            console.log("Sent requests response:", response.data);
            setSentRequests(response.data.sentRequests || []);
        } catch (error) {
            console.error(
                "Error fetching sent requests:",
                error.response?.data || error.message
            );
            setError("Failed to fetch sent requests");
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await axios.post("/friends/request", {
                email: friendEmail,
            });

            console.log("Add friend response:", response.data);

            // Add the new request to the sent requests list
            if (response.data.request) {
                setSentRequests((prevRequests) => [
                    ...(prevRequests || []),
                    response.data.request,
                ]);
            }

            setFriendEmail("");
            setSuccess("Friend request sent successfully!");
        } catch (error) {
            console.error(
                "Error sending friend request:",
                error.response?.data
            );
            setError(
                error.response?.data?.message || "Failed to send friend request"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const response = await axios.post(`/friends/accept/${requestId}`);
            setSuccess("Friend request accepted!");
            await Promise.all([fetchFriendRequests(), fetchFriends()]);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to accept friend request"
            );
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            const response = await axios.post(`/friends/decline/${requestId}`);
            setSuccess("Friend request declined!");
            await fetchFriendRequests();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                    "Failed to decline friend request"
            );
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            console.log("Cancelling request:", requestId); // Debug log
            const response = await axios.delete(
                `/friends/request/${requestId}`
            );

            // Remove the cancelled request from the UI
            setSentRequests((prevRequests) =>
                prevRequests.filter((request) => request._id !== requestId)
            );

            setSuccess("Friend request cancelled successfully!");
        } catch (error) {
            console.error(
                "Error canceling request:",
                error.response?.data || error
            );
            setError(
                error.response?.data?.message ||
                    "Failed to cancel friend request"
            );
        }
    };

    return (
        <div className="container mx-auto px-4 pt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Welcome and Add Friend */}
                <div className="bg-gray-800 rounded-lg p-6 text-white">
                    <h1 className="text-2xl font-bold mb-4">
                        Welcome, {user.username}!
                    </h1>

                    {/* Add Friend Form */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Add Friend
                        </h2>
                        <form onSubmit={handleAddFriend} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="friendEmail"
                                    className="block text-sm font-medium mb-2"
                                >
                                    Friend's Email
                                </label>
                                <input
                                    type="email"
                                    id="friendEmail"
                                    value={friendEmail}
                                    onChange={(e) =>
                                        setFriendEmail(e.target.value)
                                    }
                                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                                    placeholder="Enter friend's email"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded">
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? "Sending Request..."
                                    : "Send Friend Request"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column - Friends List and Requests */}
                <div className="space-y-6">
                    {/* Sent Friend Requests */}
                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <h2 className="text-xl font-semibold mb-4">
                            Sent Friend Requests
                        </h2>
                        {!sentRequests || sentRequests.length === 0 ? (
                            <p className="text-gray-400">
                                No pending sent requests
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {sentRequests.map((request) => (
                                    <li
                                        key={request._id}
                                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {request.to?.username ||
                                                    "Loading..."}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                {request.to?.email || ""}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                Sent:{" "}
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleCancelRequest(request._id)
                                            }
                                            className="bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700 transition-colors"
                                        >
                                            Cancel Request
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Friend Requests */}
                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <h2 className="text-xl font-semibold mb-4">
                            Friend Requests
                        </h2>
                        {friendRequests.length === 0 ? (
                            <p className="text-gray-400">
                                No pending friend requests
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {friendRequests.map((request) => (
                                    <li
                                        key={request._id}
                                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                                    >
                                        <span>{request.from.username}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleAcceptRequest(
                                                        request._id
                                                    )
                                                }
                                                className="bg-green-600 text-white px-4 py-1 rounded-md hover:bg-green-700 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeclineRequest(
                                                        request._id
                                                    )
                                                }
                                                className="bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700 transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Friends List */}
                    <div className="bg-gray-800 rounded-lg p-6 text-white">
                        <h2 className="text-xl font-semibold mb-4">
                            Your Friends
                        </h2>
                        {friends.length === 0 ? (
                            <p className="text-gray-400">
                                No friends added yet
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {friends.map((friend) => (
                                    <li
                                        key={friend._id}
                                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                                    >
                                        <span>{friend.username}</span>
                                        <span className="text-gray-400 text-sm">
                                            {friend.email}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                    {message}
                </div>
            )}
        </div>
    );
}
