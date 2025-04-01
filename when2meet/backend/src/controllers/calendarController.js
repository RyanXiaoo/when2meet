import { google } from "googleapis";
import { Client } from "@notionhq/client";
import User from "../models/User.js";

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Log the configuration
console.log("OAuth2 Client Configuration:", {
    clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + "...",
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// Google Calendar API scope
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export const initiateGoogleAuth = (req, res) => {
    try {
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
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens to user document
        await User.findByIdAndUpdate(req.user._id, {
            "googleCalendar.accessToken": tokens.access_token,
            "googleCalendar.refreshToken": tokens.refresh_token,
            "googleCalendar.expiry": tokens.expiry_date,
        });

        res.redirect("/dashboard?calendar=google-connected");
    } catch (error) {
        console.error("Google Calendar Auth Error:", error);
        res.redirect("/dashboard?error=google-auth-failed");
    }
};

export const syncGoogleCalendar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

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

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: thirtyDaysFromNow.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        });

        // Process and save events
        const events = response.data.items.map((event) => ({
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            source: "google",
        }));

        // Update user's calendar events
        await User.findByIdAndUpdate(req.user._id, {
            $push: { calendarEvents: { $each: events } },
        });

        res.json({ message: "Calendar synced successfully", events });
    } catch (error) {
        console.error("Google Calendar Sync Error:", error);
        res.status(500).json({ message: "Failed to sync calendar" });
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
        const user = await User.findById(req.user._id);

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

            // Set up OAuth2 client with user's tokens
            oauth2Client.setCredentials({
                access_token: user.googleCalendar.accessToken,
                refresh_token: user.googleCalendar.refreshToken,
            });

            const calendar = google.calendar({
                version: "v3",
                auth: oauth2Client,
            });

            // Get events for next 30 days
            const now = new Date();
            const thirtyDaysFromNow = new Date(
                now.getTime() + 30 * 24 * 60 * 60 * 1000
            );

            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: now.toISOString(),
                timeMax: thirtyDaysFromNow.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
            });

            events = response.data.items.map((event) => ({
                id: event.id,
                title: event.summary,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                source: "google",
            }));
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
        res.status(500).json({ message: "Failed to fetch calendar events" });
    }
};

export const getCalendarStatus = async (req, res) => {
    try {
        const { source } = req.params;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (source === "google") {
            const connected = !!user.googleCalendar?.accessToken;
            return res.json({ connected });
        } else if (source === "notion") {
            const connected = !!user.notion?.accessToken;
            return res.json({ connected });
        }

        res.status(400).json({ message: "Invalid calendar source" });
    } catch (error) {
        console.error("Calendar Status Error:", error);
        res.status(500).json({ message: "Failed to get calendar status" });
    }
};
