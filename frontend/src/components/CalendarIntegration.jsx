import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CalendarIntegration = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleGoogleConnect = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            // Redirect to backend Google auth endpoint
            window.location.href = `${
                import.meta.env.VITE_API_URL
            }/api/calendar/auth/google/calendar`;
        } catch (err) {
            setError("Failed to connect to Google Calendar. Please try again.");
            setIsConnecting(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/calendar/sync/google`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to sync calendar");
            }

            const data = await response.json();
            navigate("/dashboard?calendar=synced");
        } catch (err) {
            setError("Failed to sync calendar. Please try again.");
            setIsConnecting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Calendar Integration</h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Google Calendar
                        </h3>
                        <p className="text-gray-600">
                            Connect your Google Calendar to sync your events
                        </p>
                    </div>
                    <button
                        onClick={handleGoogleConnect}
                        disabled={isConnecting}
                        className={`px-4 py-2 rounded-md text-white ${
                            isConnecting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isConnecting
                            ? "Connecting..."
                            : "Connect Google Calendar"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

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
    );
};

export default CalendarIntegration;
