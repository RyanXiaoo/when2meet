import { google } from "googleapis";
import { Client } from "@notionhq/client";
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
                "http://localhost:5173/calendar/google?error=google-auth-failed"
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
                "http://localhost:5173/calendar/google?error=google-auth-failed"
            );
        }

        // Get tokens from Google
        console.log("Getting tokens from Google with code...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Successfully received Google tokens:", {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date,
        });

        // Update user with new tokens
        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            {
                $set: {
                    "googleCalendar.accessToken": tokens.access_token,
                    "googleCalendar.refreshToken": tokens.refresh_token,
                    "googleCalendar.expiry": new Date(tokens.expiry_date),
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            console.error("Failed to update user with tokens");
            return res.redirect(
                "http://localhost:5173/calendar/google?error=google-auth-failed"
            );
        }

        console.log("Successfully updated user with Google tokens");
        res.redirect(
            "http://localhost:5173/calendar/google?calendar=google-connected"
        );
    } catch (error) {
        console.error("Google Calendar Auth Error:", error);
        console.error("Error details:", error.response?.data || error.message);
        res.redirect(
            "http://localhost:5173/calendar/google?error=google-auth-failed"
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

export const initiateNotionAuth = (req, res) => {
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${
        process.env.NOTION_CLIENT_ID
    }&response_type=code&owner=user&state=${req.user._id.toString()}`;
    res.json({ url: notionAuthUrl });
};

export const handleNotionCallback = async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for access token
        const response = await fetch("https://api.notion.com/v1/oauth/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
                ).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, grant_type: "authorization_code" }),
        });

        const { access_token, workspace_id } = await response.json();

        // Save Notion tokens to user document
        await User.findByIdAndUpdate(req.user._id, {
            "notion.accessToken": access_token,
            "notion.workspaceId": workspace_id,
        });

        res.redirect("/dashboard?calendar=notion-connected");
    } catch (error) {
        console.error("Notion Auth Error:", error);
        res.redirect("/dashboard?error=notion-auth-failed");
    }
};

export const syncNotionCalendar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const notion = new Client({ auth: user.notion.accessToken });

        // Query Notion database for calendar events
        const response = await notion.databases.query({
            database_id: req.body.databaseId, // User needs to provide their calendar database ID
            filter: {
                and: [
                    {
                        property: "Date",
                        date: {
                            is_not_empty: true,
                        },
                    },
                ],
            },
            sorts: [
                {
                    property: "Date",
                    direction: "ascending",
                },
            ],
        });

        // Process and save events
        const events = response.results.map((page) => ({
            title: page.properties.Name.title[0]?.plain_text || "Untitled",
            start: page.properties.Date.date.start,
            end:
                page.properties.Date.date.end ||
                page.properties.Date.date.start,
            source: "notion",
        }));

        // Update user's calendar events
        await User.findByIdAndUpdate(req.user._id, {
            $push: { calendarEvents: { $each: events } },
        });

        res.json({ message: "Notion calendar synced successfully", events });
    } catch (error) {
        console.error("Notion Calendar Sync Error:", error);
        res.status(500).json({ message: "Failed to sync Notion calendar" });
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
        } else if (source === "notion") {
            if (!user.notion?.accessToken) {
                return res
                    .status(400)
                    .json({ message: "Notion not connected" });
            }

            const notion = new Client({ auth: user.notion.accessToken });

            // Query Notion database for calendar events
            const response = await notion.databases.query({
                database_id: user.notion.calendarDatabaseId,
                filter: {
                    and: [
                        {
                            property: "Date",
                            date: {
                                is_not_empty: true,
                            },
                        },
                    ],
                },
                sorts: [
                    {
                        property: "Date",
                        direction: "ascending",
                    },
                ],
            });

            events = response.results.map((page) => ({
                id: page.id,
                title: page.properties.Name.title[0]?.plain_text || "Untitled",
                start: page.properties.Date.date.start,
                end:
                    page.properties.Date.date.end ||
                    page.properties.Date.date.start,
                source: "notion",
            }));
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
            .select("+googleCalendar +notion")
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
        } else if (source === "notion") {
            isConnected = !!user.notion?.accessToken;
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
