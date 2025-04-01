import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    initiateNotionAuth,
    handleNotionCallback,
    syncGoogleCalendar,
    syncNotionCalendar,
    getCalendarEvents,
    getCalendarStatus,
} from "../controllers/calendarController.js";

const router = express.Router();

// Google Calendar routes
router.get("/auth/google/calendar", initiateGoogleAuth);
router.get("/auth/google/calendar/callback", protect, handleGoogleCallback);
router.post("/sync/google", protect, syncGoogleCalendar);

// Notion routes
router.get("/auth/notion", protect, initiateNotionAuth);
router.get("/auth/notion/callback", protect, handleNotionCallback);
router.post("/sync/notion", protect, syncNotionCalendar);

// Status routes
router.get("/status/:source", protect, getCalendarStatus);

// Get calendar events
router.get("/events/:source", protect, getCalendarEvents);

export default router;
