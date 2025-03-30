import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import {
    initiateGoogleAuth,
    handleGoogleCallback,
    initiateNotionAuth,
    handleNotionCallback,
    syncGoogleCalendar,
    syncNotionCalendar,
} from "../controllers/calendarController.js";

const router = express.Router();

// Google Calendar routes
router.get("/auth/google/calendar", authenticateUser, initiateGoogleAuth);
router.get("/auth/google/callback", authenticateUser, handleGoogleCallback);
router.post("/sync/google", authenticateUser, syncGoogleCalendar);

// Notion routes
router.get("/auth/notion", authenticateUser, initiateNotionAuth);
router.get("/auth/notion/callback", authenticateUser, handleNotionCallback);
router.post("/sync/notion", authenticateUser, syncNotionCalendar);

export default router;
