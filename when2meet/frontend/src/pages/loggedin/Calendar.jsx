import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import { useLocation } from "react-router-dom";

export default function Calendar() {
    const [activeCalendar, setActiveCalendar] = useState("google");
    const [isConnected, setIsConnected] = useState({
        google: false,
        notion: false,
    });
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const location = useLocation();

    // Check connection status and get events on mount
    useEffect(() => {
        checkConnectionStatus();
        fetchEvents();

        // Check for connection success/error from OAuth callback
        const params = new URLSearchParams(location.search);
        if (params.get("connection") === "success") {
            setSuccess("Calendar connected successfully!");
            checkConnectionStatus(); // Refresh status
            fetchEvents(); // Get new events
        }
        if (params.get("error")) {
            setError(params.get("error"));
        }
    }, [location]);

    const checkConnectionStatus = async () => {
        try {
            const response = await axios.get("/calendar/status");
            setIsConnected(response.data);
        } catch (error) {
            console.error("Error checking calendar status:", error);
            setError("Failed to check calendar connection status");
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await axios.get("/calendar/events");
            setEvents(response.data.events);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to fetch calendar events");
        }
    };

    const handleConnect = async (provider) => {
        try {
            const response = await axios.get(`/calendar/auth/${provider}`);
            window.location.href = response.data.url;
        } catch (error) {
            console.error(`Error connecting to ${provider}:`, error);
            setError(`Failed to connect to ${provider}`);
        }
    };

    const handleDisconnect = async (provider) => {
        try {
            await axios.delete(`/calendar/disconnect/${provider}`);
            setIsConnected((prev) => ({ ...prev, [provider]: false }));
            setSuccess(`${provider} calendar disconnected successfully`);
            setEvents(events.filter((event) => event.source !== provider));
        } catch (error) {
            console.error(`Error disconnecting ${provider}:`, error);
            setError(`Failed to disconnect ${provider}`);
        }
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <div className="flex space-x-4">
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeCalendar === "google"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            onClick={() => setActiveCalendar("google")}
                        >
                            Google Calendar
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeCalendar === "notion"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            onClick={() => setActiveCalendar("notion")}
                        >
                            Notion Calendar
                        </button>
                    </div>
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

                {/* Calendar Integration Section */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {activeCalendar === "google"
                            ? "Google Calendar"
                            : "Notion"}{" "}
                        Integration
                    </h2>
                    {!isConnected[activeCalendar] ? (
                        <div className="text-center">
                            <p className="mb-4">
                                Connect your{" "}
                                {activeCalendar === "google"
                                    ? "Google Calendar"
                                    : "Notion"}{" "}
                                account to sync your events
                            </p>
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                onClick={() => handleConnect(activeCalendar)}
                            >
                                Connect{" "}
                                {activeCalendar === "google"
                                    ? "Google Calendar"
                                    : "Notion"}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-green-400 mb-4">
                                ✓ Connected to{" "}
                                {activeCalendar === "google"
                                    ? "Google Calendar"
                                    : "Notion"}
                            </p>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                                onClick={() => handleDisconnect(activeCalendar)}
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>

                {/* Calendar Events Section */}
                <div className="bg-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Upcoming Events
                    </h2>
                    {events.length === 0 ? (
                        <p className="text-gray-400 text-center">
                            No upcoming events
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div
                                    key={`${event.source}-${event.id}`}
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
                                        <span className="text-xs text-gray-400">
                                            Source: {event.source}
                                        </span>
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
