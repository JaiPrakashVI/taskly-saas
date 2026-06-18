"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../config/db"));
const response_1 = require("../../utils/response");
const JWT_SECRET = process.env.JWT_SECRET || 'keel_default_secret_key';
const SALT_ROUNDS = 10;
// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if the user already exists
        const existingUser = await db_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            (0, response_1.sendError)(res, 'Email is already registered.', 400);
            return;
        }
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        // Create the user
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        // Generate JWT token containing user identity details
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h',
        });
        (0, response_1.sendSuccess)(res, {
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        }, 201);
    }
    catch (error) {
        // Keep error logs secure on the server side
        console.error('Registration error:', error);
        (0, response_1.sendError)(res, 'An error occurred during registration.', 500);
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Retrieve user by email
        const user = await db_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password.', 401);
            return;
        }
        // Compare provided password with hashed password in database
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            (0, response_1.sendError)(res, 'Invalid email or password.', 401);
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h',
        });
        (0, response_1.sendSuccess)(res, {
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        (0, response_1.sendError)(res, 'An error occurred during login.', 500);
    }
};
exports.login = login;
// POST /api/auth/logout
const logout = async (req, res) => {
    // Client is responsible for deleting the JWT token from localStorage.
    // Standard token-based logout responds with a message that the logout was successful.
    (0, response_1.sendSuccess)(res, { message: 'Logged out successfully.' });
};
exports.logout = logout;
