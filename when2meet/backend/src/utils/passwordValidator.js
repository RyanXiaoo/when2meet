import validator from "validator";

export const validatePassword = (password) => {
    const errors = [];

    // Check minimum length
    if (!validator.isLength(password, { min: 8 })) {
        errors.push("Password must be at least 8 characters long");
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    // Check for numbers
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};
