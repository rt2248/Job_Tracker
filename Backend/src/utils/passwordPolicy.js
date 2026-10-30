const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128; // Protects against bcrypt CPU exhaustion DoS attacks while supporting passphrases

/**
 * Validates a password against server security policy:
 * - 8 to 128 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character
 *
 * @param {any} password
 * @returns {string | null} Returns an error message if invalid, or null if compliant
 */
function validatePassword(password) {
    if (typeof password !== "string" || password.length === 0) {
        return "Password is required and must be a string";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`;
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/\d/.test(password)) {
        return "Password must contain at least one digit";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
}

module.exports = {
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    validatePassword,
};
