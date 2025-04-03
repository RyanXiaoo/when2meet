import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    syncGoogleCalendar,
    getCalendarEvents,
    getCalendarStatus,
    disconnectGoogleCalendar,
    getCalendarPriorities,
    saveCalendarPriorities,
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

// Calendar priorities routes
router.get("/priorities", protect, getCalendarPriorities);
router.post("/priorities", protect, saveCalendarPriorities);

export default router;
