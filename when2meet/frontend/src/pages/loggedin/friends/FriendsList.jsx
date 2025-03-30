import { useState, useEffect } from "react";
import axios from "axios";

export default function FriendsList() {
    const [friends, setFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchBy, setSearchBy] = useState("username");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [friendEmail, setFriendEmail] = useState("");

    useEffect(() => {
        fetchFriends();
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

    const handleRemoveFriend = async (friendId) => {
        try {
            await axios.delete(`/friends/remove/${friendId}`);
            setFriends((prevFriends) =>
                prevFriends.filter((friend) => friend._id !== friendId)
            );
            setSuccess("Friend removed successfully!");
        } catch (error) {
            console.error("Error removing friend:", error.response?.data);
            setError(
                error.response?.data?.message || "Failed to remove friend"
            );
        }
    };

    const handleAddFriend = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/friends/request", { email: friendEmail });
            setSuccess("Friend request sent successfully!");
            setFriendEmail("");
            setError("");
        } catch (error) {
            setError(
                error.response?.data?.message || "Failed to send friend request"
            );
            setSuccess("");
        }
    };

    const filteredFriends = friends.filter((friend) => {
        const searchLower = searchTerm.toLowerCase();
        if (searchBy === "username") {
            return friend.username.toLowerCase().includes(searchLower);
        } else {
            return friend.email.toLowerCase().includes(searchLower);
        }
    });

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Your Friends</h1>
                    <form onSubmit={handleAddFriend} className="flex space-x-2">
                        <input
                            type="email"
                            value={friendEmail}
                            onChange={(e) => setFriendEmail(e.target.value)}
                            placeholder="Enter friend's email"
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add Friend
                        </button>
                    </form>
                </div>

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

                <div className="flex items-center space-x-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search friends by username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={searchBy}
                        onChange={(e) => setSearchBy(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="username">Username</option>
                        <option value="email">Email</option>
                    </select>
                </div>

                {filteredFriends.length === 0 ? (
                    <p className="text-gray-400">
                        {searchTerm
                            ? `No friends match your ${searchBy} search`
                            : "No friends added yet"}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {filteredFriends.map((friend) => (
                            <li
                                key={friend._id}
                                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">
                                        {friend.username}
                                    </span>
                                    <span className="text-gray-400">
                                        {friend.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() =>
                                        handleRemoveFriend(friend._id)
                                    }
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Remove Friend
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
