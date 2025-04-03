import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    syncGoogleCalendar,
    getCalendarEvents,
    getCalendarStatus,
    disconnectGoogleCalendar,
} from "../controllers/calendarController.js";

const router = express.Router();

// Google Calendar routes
router.get("/auth/google/calendar", initiateGoogleAuth);
router.get("/auth/google/callback", handleGoogleCallback);
router.post("/sync/google", protect, syncGoogleCalendar);
router.post("/auth/google/disconnect", protect, disconnectGoogleCalendar);

// Status routes
router.get("/status/:source", protect, getCalendarStatus);

// Get calendar events
router.get("/events/:source", protect, getCalendarEvents);

export default router;
