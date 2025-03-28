import rateLimit from "express-rate-limit";

// Rate limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: "Too many password reset attempts. Please try again after 24 hours.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for forgot password requests
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per hour
    message: {
        error: "Too many forgot password requests. Please try again after an hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
