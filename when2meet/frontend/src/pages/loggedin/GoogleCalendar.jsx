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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check connection status on mount and when location changes
    useEffect(() => {
        console.log("Location changed:", location.search);
        const params = new URLSearchParams(location.search);
        const calendarStatus = params.get("calendar");
        const errorStatus = params.get("error");

        if (calendarStatus === "google-connected") {
            console.log("Google Calendar connected, checking status...");
            setSuccess("Successfully connected to Google Calendar!");
            // Force immediate status check and sync
            checkConnectionStatus();
            // Set up periodic checks
            const checkInterval = setInterval(checkConnectionStatus, 2000);
            return () => clearInterval(checkInterval);
        } else if (errorStatus === "google-auth-failed") {
            setError("Failed to connect to Google Calendar. Please try again.");
        }
    }, [location]);

    // Initial connection check
    useEffect(() => {
        console.log("Initial connection check...");
        checkConnectionStatus();
    }, []);

    // Auto-sync every 5 minutes if connected
    useEffect(() => {
        let syncInterval;

        if (isConnected) {
            // Initial sync
            handleSync();

            // Set up periodic sync
            syncInterval = setInterval(() => {
                console.log("Auto-syncing calendar...");
                handleSync();
            }, 5 * 60 * 1000); // 5 minutes
        }

        return () => {
            if (syncInterval) {
                clearInterval(syncInterval);
            }
        };
    }, [isConnected]);

    const checkConnectionStatus = async () => {
        try {
            console.log("Checking Google Calendar connection status...");
            const response = await axios.get("/calendar/status/google", {
                params: { source: "google" },
            });
            console.log("Status response:", response.data);

            const isNowConnected = response.data.connected;
            setIsConnected(isNowConnected);

            if (isNowConnected) {
                console.log("Connected! Fetching events...");
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
            console.log("Fetched events:", response.data);

            // Sort events by start date
            const sortedEvents = (response.data.events || []).sort(
                (a, b) => new Date(a.start) - new Date(b.start)
            );

            // Group events by date
            const groupedEvents = sortedEvents.reduce((groups, event) => {
                const date = new Date(event.start).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(event);
                return groups;
            }, {});

            setEvents(sortedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to fetch calendar events");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Helper function to get event duration in pixels
    const getEventHeight = (start, end) => {
        const duration = (new Date(end) - new Date(start)) / (1000 * 60); // in minutes
        return Math.max(duration, 30); // minimum height of 30px
    };

    // Helper function to get event position
    const getEventPosition = (start) => {
        const date = new Date(start);
        const minutes = date.getHours() * 60 + date.getMinutes();
        return minutes;
    };

    // Group events by date
    const getEventsByDate = () => {
        const grouped = {};
        events.forEach((event) => {
            const date = new Date(event.start).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    };

    const handleGoogleConnect = async () => {
        try {
            setIsConnecting(true);
            setError(null);
            console.log("Initiating Google Calendar connection...");
            const response = await axios.get("/calendar/auth/google/calendar");
            console.log("Got auth URL:", response.data);
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
            setSuccess(null);

            // First, sync with Google Calendar
            const syncResponse = await axios.post("/calendar/sync/google");
            console.log("Sync response:", syncResponse.data);

            // Then fetch the updated events
            const eventsResponse = await axios.get("/calendar/events/google");
            console.log("Updated events:", eventsResponse.data);

            // Sort and set the events
            const sortedEvents = (eventsResponse.data.events || []).sort(
                (a, b) => new Date(a.start) - new Date(b.start)
            );
            setEvents(sortedEvents);

            // Show success message with event count
            const eventCount = sortedEvents.length;
            setSuccess(
                `Successfully synced ${eventCount} events from Google Calendar`
            );
        } catch (err) {
            console.error("Sync error:", err);
            setError(
                err.response?.data?.message ||
                    "Failed to sync calendar. Please try again."
            );
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const response = await axios.post(
                "/calendar/auth/google/disconnect"
            );

            setIsConnected(false);
            setSuccess("Successfully disconnected from Google Calendar");
            setEvents([]); // Clear the events list
        } catch (error) {
            console.error("Error disconnecting from Google Calendar:", error);
            setError(
                "Failed to disconnect from Google Calendar. Please try again."
            );
        } finally {
            setIsConnecting(false);
        }
    };

    const DAYS_OF_WEEK = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    const getMonthData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        const weeks = [];
        let week = new Array(7).fill(null);
        let dayCounter = 1;

        // Fill in the first week with empty days until the first day of the month
        for (let i = firstDayOfMonth; i < 7 && dayCounter <= daysInMonth; i++) {
            week[i] = dayCounter++;
        }
        weeks.push(week);

        // Fill in the rest of the weeks
        while (dayCounter <= daysInMonth) {
            week = new Array(7).fill(null);
            for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
                week[i] = dayCounter++;
            }
            weeks.push(week);
        }

        return weeks;
    };

    const getEventsForDate = (date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.start);
            return (
                eventDate.getDate() === date &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    const navigateMonth = (direction) => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + direction);
            return newDate;
        });
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const events = getEventsForDate(day);
        setSelectedDayEvents(events);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        Google Calendar Integration
                    </h2>
                    {!isConnected && (
                        <button
                            onClick={handleGoogleConnect}
                            disabled={isConnecting}
                            className={`px-4 py-2 rounded ${
                                isConnecting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600"
                            } text-white font-medium transition-colors`}
                        >
                            {isConnecting
                                ? "Connecting..."
                                : "Connect Google Calendar"}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                {/* Connection Status */}
                <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                    <p className="text-sm">
                        Status:{" "}
                        {isConnected ? (
                            <span className="text-green-500">Connected</span>
                        ) : (
                            <span className="text-yellow-500">
                                Not Connected
                            </span>
                        )}
                    </p>
                </div>

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
                            <div className="flex items-center space-x-4">
                                {isConnected && (
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={isConnecting}
                                        className={`px-4 py-2 rounded ${
                                            isConnecting
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-red-500 hover:bg-red-600"
                                        } text-white font-medium transition-colors`}
                                    >
                                        {isConnecting
                                            ? "Disconnecting..."
                                            : "Disconnect"}
                                    </button>
                                )}
                            </div>
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
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigateMonth(-1)}
                                    className="p-2 rounded hover:bg-gray-600"
                                >
                                    ←
                                </button>
                                <h3 className="text-xl font-semibold">
                                    {MONTHS[currentDate.getMonth()]}{" "}
                                    {currentDate.getFullYear()}
                                </h3>
                                <button
                                    onClick={() => navigateMonth(1)}
                                    className="p-2 rounded hover:bg-gray-600"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <p className="text-gray-400">
                                    Loading events...
                                </p>
                            </div>
                        ) : (
                            <div className="calendar-grid">
                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <div
                                            key={day}
                                            className="text-center py-2 text-gray-400 font-medium"
                                        >
                                            {day.slice(0, 3)}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {getMonthData().map((week, weekIndex) =>
                                        week.map((day, dayIndex) => {
                                            const dateEvents = day
                                                ? getEventsForDate(day)
                                                : [];
                                            const isToday =
                                                day &&
                                                new Date().getDate() === day &&
                                                new Date().getMonth() ===
                                                    currentDate.getMonth() &&
                                                new Date().getFullYear() ===
                                                    currentDate.getFullYear();

                                            return (
                                                <div
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    onClick={() =>
                                                        handleDayClick(day)
                                                    }
                                                    className={`min-h-[120px] p-2 rounded-lg transition-all duration-200 ${
                                                        day
                                                            ? "bg-gray-800/80 hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                                                            : "bg-gray-800/30"
                                                    } ${
                                                        isToday
                                                            ? "ring-2 ring-blue-500"
                                                            : ""
                                                    }`}
                                                >
                                                    {day && (
                                                        <>
                                                            <div
                                                                className={`text-right text-sm mb-2 ${
                                                                    isToday
                                                                        ? "text-blue-400 font-semibold"
                                                                        : "text-gray-400"
                                                                }`}
                                                            >
                                                                {day}
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {dateEvents
                                                                    .slice(0, 5)
                                                                    .map(
                                                                        (
                                                                            event,
                                                                            index
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    event.id ||
                                                                                    index
                                                                                }
                                                                                className="text-xs p-1.5 rounded-md bg-indigo-600/90 hover:bg-indigo-500 transition-colors cursor-pointer truncate shadow-sm"
                                                                                title={`${
                                                                                    event.title
                                                                                } (${formatTime(
                                                                                    event.start
                                                                                )} - ${formatTime(
                                                                                    event.end
                                                                                )})${
                                                                                    event.calendar
                                                                                        ? `\nCalendar: ${event.calendar}`
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center space-x-1.5">
                                                                                    <span className="font-medium">
                                                                                        {formatTime(
                                                                                            event.start
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            event.title
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                {dateEvents.length >
                                                                    5 && (
                                                                    <div className="text-xs text-gray-400 text-center py-1 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors">
                                                                        +
                                                                        {dateEvents.length -
                                                                            5}{" "}
                                                                        more
                                                                        events
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-white">
                                Events for{" "}
                                {selectedDayEvents[0]
                                    ? new Date(
                                          selectedDayEvents[0].start
                                      ).toLocaleDateString(undefined, {
                                          weekday: "long",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : ""}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3">
                            {selectedDayEvents.map((event, index) => (
                                <div
                                    key={event.id || index}
                                    className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-all duration-200 hover:shadow-lg"
                                >
                                    <div className="font-semibold text-lg mb-1">
                                        {event.title}
                                    </div>
                                    <div className="text-sm text-blue-300 font-medium">
                                        {formatTime(event.start)} -{" "}
                                        {formatTime(event.end)}
                                    </div>
                                    {event.calendar && (
                                        <div className="text-sm text-gray-300 mt-2 flex items-center">
                                            <span className="mr-2">📅</span>
                                            {event.calendar}
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="text-sm text-gray-300 mt-1 flex items-center">
                                            <span className="mr-2">📍</span>
                                            {event.location}
                                        </div>
                                    )}
                                    {event.description && (
                                        <div className="text-sm text-gray-400 mt-3 p-2 bg-gray-800/50 rounded-lg">
                                            {event.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
