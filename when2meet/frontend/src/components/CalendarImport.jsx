import { useState } from "react";
import axios from "axios";

export default function CalendarImport() {
    const [loading, setLoading] = useState({
        google: false,
        notion: false,
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleGoogleAuth = async () => {
        setLoading((prev) => ({ ...prev, google: true }));
        try {
            // Redirect to backend route that initiates Google OAuth
            window.location.href = "/api/auth/google/calendar";
        } catch (error) {
            setError("Failed to connect to Google Calendar");
            setLoading((prev) => ({ ...prev, google: false }));
        }
    };

    const handleNotionAuth = async () => {
        setLoading((prev) => ({ ...prev, notion: true }));
        try {
            // Redirect to backend route that initiates Notion OAuth
            window.location.href = "/api/auth/notion";
        } catch (error) {
            setError("Failed to connect to Notion");
            setLoading((prev) => ({ ...prev, notion: false }));
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Import Calendar</h2>

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

            <div className="space-y-4">
                <button
                    onClick={handleGoogleAuth}
                    disabled={loading.google}
                    className="w-full bg-white text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                    <img
                        src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png"
                        alt="Google Calendar"
                        className="w-6 h-6"
                    />
                    <span>
                        {loading.google
                            ? "Connecting..."
                            : "Import from Google Calendar"}
                    </span>
                </button>

                <button
                    onClick={handleNotionAuth}
                    disabled={loading.notion}
                    className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 border border-gray-700"
                >
                    <img
                        src="https://www.notion.so/images/favicon.ico"
                        alt="Notion"
                        className="w-6 h-6"
                    />
                    <span>
                        {loading.notion
                            ? "Connecting..."
                            : "Import from Notion"}
                    </span>
                </button>
            </div>
        </div>
    );
}
