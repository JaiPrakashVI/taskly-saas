"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../utils/response");
// Middleware to authenticate JWT tokens in the request authorization headers.
// Expects: "Authorization: Bearer <token>"
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // The token is typically formatted as "Bearer <JWT_TOKEN>"
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        (0, response_1.sendError)(res, 'Access denied. No authentication token provided.', 401);
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET || 'keel_default_secret_key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Attach the decoded token payload to the request for subsequent handlers
        req.user = decoded;
        next();
    }
    catch (error) {
        (0, response_1.sendError)(res, 'Authentication failed. Invalid or expired token.', 401);
    }
};
exports.authenticateToken = authenticateToken;
