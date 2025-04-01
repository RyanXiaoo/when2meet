import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { useLocation } from "react-router-dom";

export default function NotionCalendar() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const location = useLocation();

    // Check connection status and get events on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const calendarStatus = params.get("calendar");
        const errorStatus = params.get("error");

        if (calendarStatus === "notion-connected") {
            setSuccess("Successfully connected to Notion Calendar!");
        } else if (calendarStatus === "synced") {
            setSuccess("Calendar events synced successfully!");
        } else if (errorStatus === "notion-auth-failed") {
            setError("Failed to connect to Notion. Please try again.");
        }

        fetchEvents();
    }, [location]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await axios.get("/events/notion");
            setEvents(response.data.events || []);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to fetch calendar events");
        } finally {
            setLoading(false);
        }
    };

    const handleNotionConnect = async () => {
        try {
            setIsConnecting(true);
            setError(null);
            const response = await axios.get("/auth/notion");
            window.location.href = response.data.url;
        } catch (err) {
            setError("Failed to connect to Notion. Please try again.");
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsConnecting(true);
            setError(null);
            const response = await axios.post("/sync/notion");
            if (response.data) {
                setSuccess("Calendar synced successfully!");
                fetchEvents(); // Refresh events after sync
            }
        } catch (err) {
            setError("Failed to sync calendar. Please try again.");
            setIsConnecting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">
                        Notion Calendar Integration
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* Notion Calendar Integration Section */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Connect Notion Calendar
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Notion Calendar</h3>
                                <p className="text-sm text-gray-400">
                                    Connect your Notion calendar to sync your
                                    events
                                </p>
                            </div>
                            <button
                                onClick={handleNotionConnect}
                                disabled={isConnecting}
                                className={`px-4 py-2 rounded-md text-white ${
                                    isConnecting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {isConnecting
                                    ? "Connecting..."
                                    : "Connect Notion"}
                            </button>
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={handleSync}
                                disabled={isConnecting}
                                className={`px-4 py-2 rounded-md text-white ${
                                    isConnecting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isConnecting ? "Syncing..." : "Sync Calendar"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Events Section */}
                <div className="bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Upcoming Events
                    </h2>
                    {loading ? (
                        <p className="text-gray-400 text-center">
                            Loading events...
                        </p>
                    ) : events.length === 0 ? (
                        <p className="text-gray-400 text-center">
                            No upcoming events
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div
                                    key={`notion-${event.id}`}
                                    className="flex items-center justify-between bg-gray-600 p-4 rounded-lg"
                                >
                                    <div>
                                        <h3 className="font-medium">
                                            {event.title}
                                        </h3>
                                        <p className="text-sm text-gray-300">
                                            {new Date(
                                                event.start
                                            ).toLocaleString()}{" "}
                                            -{" "}
                                            {new Date(
                                                event.end
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
