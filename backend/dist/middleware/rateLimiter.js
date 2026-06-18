"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiter for Login attempts (10 attempts per 15 minutes per IP)
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter for Register attempts (5 attempts per 15 minutes per IP)
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});
