import { google } from "googleapis";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Google Calendar API scope
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export const initiateGoogleAuth = (req, res) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];

        // Create new OAuth2 client for this request
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        console.log("OAuth2 Client Configuration:", {
            clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + "...",
            redirectUri: process.env.GOOGLE_REDIRECT_URI,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        });

        // Manually construct the auth URL with all required parameters
        const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            response_type: "code",
            access_type: "offline",
            scope: SCOPES.join(" "),
            include_granted_scopes: "true",
            prompt: "consent",
            state: token, // Pass the JWT token as state parameter
        });

        const authUrl = `${baseUrl}?${params.toString()}`;
        console.log("Generated Auth URL:", authUrl);
        res.json({ url: authUrl });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: "Failed to initiate Google auth" });
    }
};

export const handleGoogleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        console.log("Callback received with code and state:", {
            hasCode: !!code,
            hasState: !!state,
            stateLength: state?.length,
        });

        if (!state) {
            console.error("No state (token) provided in callback");
            return res.redirect(
                "http://localhost:5173/dashboard?error=google-auth-failed"
            );
        }

        // Create new OAuth2 client for this request
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Verify the JWT token
        let decoded;
        try {
            decoded = jwt.verify(state, process.env.JWT_SECRET);
            console.log("Successfully decoded JWT token:", {
                userId: decoded.id,
                tokenIsValid: !!decoded,
            });
        } catch (error) {
            console.error("Failed to verify JWT:", error);
            return res.redirect(
                "http://localhost:5173/dashboard?error=google-auth-failed"
            );
        }

        // Get tokens from Google
        console.log("Getting tokens from Google with code...");
        console.log("OAuth2 Client Config:", {
            clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + "...",
            redirectUri: process.env.GOOGLE_REDIRECT_URI,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        });

        const { tokens } = await oauth2Client.getToken(code);
        console.log("Successfully received Google tokens:", {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date,
            tokenLength: tokens.access_token?.length,
        });

        // Find user first to verify they exist
        const user = await User.findById(decoded.id);
        if (!user) {
            console.error("User not found:", decoded.id);
            return res.redirect(
                "http://localhost:5173/dashboard?error=google-auth-failed"
            );
        }
        console.log("Found user for token update:", user._id);

        // Save tokens to user document
        console.log("Attempting to save tokens to user document...");
        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            {
                $set: {
                    "googleCalendar.accessToken": tokens.access_token,
                    "googleCalendar.refreshToken": tokens.refresh_token,
                    "googleCalendar.expiry": new Date(tokens.expiry_date),
                },
            },
            { new: true, select: "+googleCalendar" }
        );

        console.log("Token update result:", {
            success: !!updatedUser,
            hasAccessToken: !!updatedUser?.googleCalendar?.accessToken,
            hasRefreshToken: !!updatedUser?.googleCalendar?.refreshToken,
            expiry: updatedUser?.googleCalendar?.expiry,
        });

        if (!updatedUser?.googleCalendar?.accessToken) {
            console.error("Failed to save tokens to user document");
            return res.redirect(
                "http://localhost:5173/dashboard?error=google-auth-failed"
            );
        }

        console.log("Successfully updated user with Google tokens");
        res.redirect(
            "http://localhost:5173/dashboard?calendar=google-connected"
        );
    } catch (error) {
        console.error("Google Calendar Auth Error:", error);
        console.error("Error details:", error.response?.data || error.message);
        res.redirect(
            "http://localhost:5173/dashboard?error=google-auth-failed"
        );
    }
};

export const syncGoogleCalendar = async (req, res) => {
    try {
        // Get user with calendar fields
        const user = await User.findById(req.user._id).select(
            "+googleCalendar"
        );

        if (!user?.googleCalendar?.accessToken) {
            return res
                .status(400)
                .json({ message: "Google Calendar not connected" });
        }

        // Create new OAuth2 client for this request
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Set up OAuth2 client with user's tokens
        oauth2Client.setCredentials({
            access_token: user.googleCalendar.accessToken,
            refresh_token: user.googleCalendar.refreshToken,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Get events for next 30 days
        const now = new Date();
        const thirtyDaysFromNow = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        console.log("Fetching Google Calendar events...");
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: thirtyDaysFromNow.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        });

        console.log(`Found ${response.data.items.length} events`);

        // Process and save events
        const events = response.data.items.map((event) => ({
            id: event.id,
            title: event.summary || "Untitled Event",
            description: event.description,
            location: event.location,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            source: "google",
        }));

        // Update user's calendar events
        await User.findByIdAndUpdate(req.user._id, {
            $set: { calendarEvents: events }, // Replace all events instead of pushing
        });

        console.log("Successfully synced calendar events");
        res.json({ message: "Calendar synced successfully", events });
    } catch (error) {
        console.error("Google Calendar Sync Error:", error);
        console.error("Error details:", error.response?.data || error.message);
        res.status(500).json({
            message: "Failed to sync calendar",
            error: error.response?.data?.message || error.message,
        });
    }
};

export const getCalendarEvents = async (req, res) => {
    try {
        const { source } = req.params;
        const user = await User.findById(req.user._id).select(
            "+googleCalendar"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let events = [];

        if (source === "google") {
            if (!user.googleCalendar?.accessToken) {
                return res
                    .status(400)
                    .json({ message: "Google Calendar not connected" });
            }

            // Create new OAuth2 client for this request
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            // Set up OAuth2 client with user's tokens
            oauth2Client.setCredentials({
                access_token: user.googleCalendar.accessToken,
                refresh_token: user.googleCalendar.refreshToken,
            });

            const calendar = google.calendar({
                version: "v3",
                auth: oauth2Client,
            });

            // First, get all calendar IDs the user has access to
            console.log("Fetching calendar list...");
            const calendarList = await calendar.calendarList.list();
            console.log(`Found ${calendarList.data.items.length} calendars`);

            // Get events for 6 months range (3 months before and 3 months after)
            const now = new Date();
            const threeMonthsAgo = new Date(
                now.getFullYear(),
                now.getMonth() - 3,
                1
            );
            const threeMonthsFromNow = new Date(
                now.getFullYear(),
                now.getMonth() + 4,
                0
            );

            console.log("Fetching events from all calendars...");

            // Fetch events from all calendars
            const allEvents = [];
            for (const cal of calendarList.data.items) {
                console.log(`Fetching events from calendar: ${cal.summary}`);
                try {
                    const response = await calendar.events.list({
                        calendarId: cal.id,
                        timeMin: threeMonthsAgo.toISOString(),
                        timeMax: threeMonthsFromNow.toISOString(),
                        singleEvents: true,
                        orderBy: "startTime",
                        maxResults: 2500,
                        showDeleted: false,
                    });

                    const calendarEvents = response.data.items
                        .filter((event) => event.status !== "cancelled")
                        .map((event) => ({
                            id: event.id,
                            title: event.summary || "Untitled Event",
                            description: event.description,
                            location: event.location,
                            start: event.start.dateTime || event.start.date,
                            end: event.end.dateTime || event.end.date,
                            source: "google",
                            calendar: cal.summary,
                            status: event.status,
                            creator: event.creator?.email,
                            organizer: event.organizer?.email,
                            colorId: event.colorId,
                            calendarColorId: cal.colorId,
                            // Extract event type from summary or calendar name
                            eventType: getEventType(event.summary, cal.summary),
                            // Keep original color from Google Calendar
                            backgroundColor: event.colorId
                                ? getEventColor(event.colorId)
                                : cal.backgroundColor,
                            foregroundColor: event.colorId
                                ? getEventTextColor(event.colorId)
                                : cal.foregroundColor,
                        }));

                    allEvents.push(...calendarEvents);
                } catch (error) {
                    console.error(
                        `Error fetching events from calendar ${cal.summary}:`,
                        error
                    );
                }
            }

            // Sort all events by start time
            events = allEvents.sort(
                (a, b) => new Date(a.start) - new Date(b.start)
            );

            console.log(
                `Total events found across all calendars: ${events.length}`
            );
            console.log("Sample of processed events:", events.slice(0, 5));
        } else {
            return res.status(400).json({ message: "Invalid calendar source" });
        }

        res.json({ events });
    } catch (error) {
        console.error("Calendar Events Error:", error);
        console.error("Error details:", error.response?.data || error.message);
        res.status(500).json({
            message: "Failed to fetch calendar events",
            error: error.response?.data?.message || error.message,
        });
    }
};

export const getCalendarStatus = async (req, res) => {
    try {
        const { source } = req.query;
        console.log("Status check request:", {
            source,
            userId: req.user?._id,
            hasAuthHeader: !!req.headers.authorization,
        });

        if (!source) {
            return res.status(400).json({ message: "Source is required" });
        }

        // Get fresh user data with calendar fields
        const user = await User.findById(req.user._id)
            .select("+googleCalendar")
            .lean();

        if (!user) {
            console.error("User not found for status check");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Found user calendar data:", {
            userId: user._id,
            googleCalendar: {
                hasAccessToken: !!user.googleCalendar?.accessToken,
                hasRefreshToken: !!user.googleCalendar?.refreshToken,
                expiry: user.googleCalendar?.expiry,
                tokenLength: user.googleCalendar?.accessToken?.length,
            },
            rawGoogleCalendar: user.googleCalendar, // Temporary log to debug
        });

        let isConnected = false;
        if (source === "google") {
            // Check if we have both tokens and they haven't expired
            isConnected = !!(
                user.googleCalendar?.accessToken &&
                user.googleCalendar?.refreshToken &&
                user.googleCalendar?.expiry &&
                new Date(user.googleCalendar.expiry) > new Date()
            );
        }

        console.log(`${source} Calendar connection status:`, isConnected);
        res.json({ connected: isConnected });
    } catch (error) {
        console.error("Error checking calendar status:", error);
        res.status(500).json({ message: "Failed to check calendar status" });
    }
};

export const disconnectGoogleCalendar = async (req, res) => {
    try {
        console.log("Disconnecting Google Calendar for user:", req.user._id);

        // Remove Google Calendar tokens from user document
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    "googleCalendar.accessToken": "",
                    "googleCalendar.refreshToken": "",
                    "googleCalendar.expiry": "",
                },
            },
            { new: true, select: "+googleCalendar" }
        );

        if (!updatedUser) {
            console.error("User not found for disconnect");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Successfully disconnected Google Calendar");
        res.json({ message: "Successfully disconnected from Google Calendar" });
    } catch (error) {
        console.error("Error disconnecting Google Calendar:", error);
        res.status(500).json({
            message: "Failed to disconnect Google Calendar",
        });
    }
};

function getEventType(summary = "", calendarName = "") {
    const text = `${summary} ${calendarName}`.toLowerCase();

    // Define your categorization rules here
    if (text.includes("1b") || text.includes("1-b")) return "1B";
    if (text.includes("office hours") || text.includes("oh:"))
        return "Office Hours";
    if (text.includes("lecture") || text.includes("class")) return "Lecture";
    if (text.includes("meeting")) return "Meeting";
    if (text.includes("appointment")) return "Appointment";
    if (text.includes("deadline") || text.includes("due")) return "Deadline";
    if (text.includes("exam") || text.includes("quiz") || text.includes("test"))
        return "Assessment";

    return "Other"; // Default category
}

function getEventColor(colorId) {
    // Google Calendar color IDs mapping
    const colors = {
        1: "#7986cb", // Lavender
        2: "#33b679", // Sage
        3: "#8e24aa", // Grape
        4: "#e67c73", // Flamingo
        5: "#f6c026", // Banana
        6: "#f5511d", // Tangerine
        7: "#039be5", // Peacock
        8: "#616161", // Graphite
        9: "#3f51b5", // Blueberry
        10: "#0b8043", // Basil
        11: "#d60000", // Tomato
    };
    return colors[colorId] || "#039be5"; // Default to Peacock blue if color not found
}

function getEventTextColor(colorId) {
    // Define which color IDs should have white text
    const whiteTextColors = ["3", "6", "8", "9", "11"];
    return whiteTextColors.includes(colorId) ? "#ffffff" : "#000000";
}

// Get calendar priorities
export const getCalendarPriorities = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ priorities: user.calendarPriorities || [] });
    } catch (error) {
        console.error("Error getting calendar priorities:", error);
        res.status(500).json({ message: "Error getting calendar priorities" });
    }
};

// Save calendar priorities
export const saveCalendarPriorities = async (req, res) => {
    try {
        console.log("Save priorities request:", {
            userId: req.user?._id,
            body: req.body,
            hasAuth: !!req.headers.authorization,
        });

        const { priorities } = req.body;

        if (!Array.isArray(priorities)) {
            return res
                .status(400)
                .json({ message: "Invalid priorities format" });
        }

        // Validate each priority object
        for (const priority of priorities) {
            if (
                typeof priority.type !== "string" ||
                typeof priority.priority !== "number"
            ) {
                return res.status(400).json({
                    message: "Invalid priority object format",
                    invalidPriority: priority,
                });
            }
        }

        // Find and update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { calendarPriorities: priorities } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error("User not found:", req.user._id);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Successfully saved priorities:", {
            userId: updatedUser._id,
            prioritiesCount: priorities.length,
            savedPriorities: updatedUser.calendarPriorities,
        });

        return res.json({
            message: "Priorities saved successfully",
            priorities: updatedUser.calendarPriorities,
        });
    } catch (error) {
        console.error("Error in saveCalendarPriorities:", {
            error: error.message,
            stack: error.stack,
            code: error.code,
            userId: req.user?._id,
        });
        return res.status(500).json({
            message: "Error saving calendar priorities",
            error: error.message,
        });
    }
};
