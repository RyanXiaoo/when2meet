import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { useLocation } from "react-router-dom";

export default function GoogleCalendar() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const location = useLocation();

    // Check connection status on mount
    useEffect(() => {
        checkConnectionStatus();
    }, []);

    // Check for redirect status
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const calendarStatus = params.get("calendar");
        const errorStatus = params.get("error");

        if (calendarStatus === "google-connected") {
            setSuccess("Successfully connected to Google Calendar!");
            checkConnectionStatus();
        } else if (calendarStatus === "synced") {
            setSuccess("Calendar events synced successfully!");
        } else if (errorStatus === "google-auth-failed") {
            setError("Failed to connect to Google Calendar. Please try again.");
        }
    }, [location]);

    const checkConnectionStatus = async () => {
        try {
            const response = await axios.get("/calendar/status/google");
            setIsConnected(response.data.connected);
            if (response.data.connected) {
                fetchEvents();
            }
        } catch (error) {
            console.error("Error checking connection status:", error);
            setIsConnected(false);
        }
    };

    const fetchEvents = async () => {
        if (!isConnected) return;

        try {
            setLoading(true);
            setError("");
            const response = await axios.get("/calendar/events/google");
            setEvents(response.data.events || []);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to fetch calendar events");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleConnect = async () => {
        try {
            setIsConnecting(true);
            setError(null);
            const response = await axios.get("/calendar/auth/google/calendar");
            if (response.data && response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error("Failed to get authorization URL");
            }
        } catch (err) {
            console.error("Google Calendar Connection Error:", err);
            setError("Failed to connect to Google Calendar. Please try again.");
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        if (!isConnected) {
            setError("Please connect to Google Calendar first");
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);
            const response = await axios.post("/calendar/sync/google");
            if (response.data) {
                setSuccess("Calendar synced successfully!");
                fetchEvents();
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
                        Google Calendar Integration
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

                {/* Google Calendar Integration Section */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Connect Google Calendar
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Google Calendar</h3>
                                <p className="text-sm text-gray-400">
                                    {isConnected
                                        ? "Your Google Calendar is connected"
                                        : "Connect your Google Calendar to sync your events"}
                                </p>
                            </div>
                            <button
                                onClick={handleGoogleConnect}
                                disabled={isConnecting}
                                className={`px-4 py-2 rounded-md text-white ${
                                    isConnecting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : isConnected
                                        ? "bg-green-600"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {isConnecting
                                    ? "Connecting..."
                                    : isConnected
                                    ? "Connected"
                                    : "Connect Google Calendar"}
                            </button>
                        </div>

                        {isConnected && (
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
                                    {isConnecting
                                        ? "Syncing..."
                                        : "Sync Calendar"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar Events Section */}
                {isConnected && (
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
                                        key={`google-${event.id}`}
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
                )}
            </div>
        </div>
    );
}
