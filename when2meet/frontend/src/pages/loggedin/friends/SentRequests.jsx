import { useState, useEffect } from "react";
import axios from "axios";

export default function SentRequests() {
    const [sentRequests, setSentRequests] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchSentRequests();
    }, []);

    const fetchSentRequests = async () => {
        try {
            const response = await axios.get("/friends/requests/sent");
            setSentRequests(response.data.sentRequests || []);
        } catch (error) {
            console.error(
                "Error fetching sent requests:",
                error.response?.data || error.message
            );
            setError("Failed to fetch sent friend requests");
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            await axios.delete(`/friends/request/${requestId}`);
            setSentRequests((prevRequests) =>
                prevRequests.filter((request) => request._id !== requestId)
            );
            setSuccess("Friend request cancelled successfully!");
        } catch (error) {
            console.error("Error cancelling request:", error.response?.data);
            setError(
                error.response?.data?.message ||
                    "Failed to cancel friend request"
            );
        }
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-6">
                    Sent Friend Requests
                </h1>

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

                {sentRequests.length === 0 ? (
                    <p className="text-gray-400">No pending sent requests</p>
                ) : (
                    <ul className="space-y-3">
                        {sentRequests.map((request) => (
                            <li
                                key={request._id}
                                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">
                                        {request.to?.username || "Loading..."}
                                    </span>
                                    <span className="text-gray-400">
                                        {request.to?.email || ""}
                                    </span>
                                    <span className="text-gray-400 text-sm">
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
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Cancel Request
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
