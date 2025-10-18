import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
    try {
        const saltRounds = 12; // Higher salt rounds for better security
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Stored hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export const verifyPassword = async (password, hashedPassword) => {
    try {
        const isValid = await bcrypt.compare(password, hashedPassword);
        return isValid;
    } catch (error) {
        console.error('Error verifying password:', error);
        throw new Error('Password verification failed');
    }
};

/**
 * Generate a random salt for password hashing
 * @param {number} rounds - Number of salt rounds (default: 12)
 * @returns {Promise<string>} - Generated salt
 */
export const generateSalt = async (rounds = 12) => {
    try {
        const salt = await bcrypt.genSalt(rounds);
        return salt;
    } catch (error) {
        console.error('Error generating salt:', error);
        throw new Error('Salt generation failed');
    }
};
