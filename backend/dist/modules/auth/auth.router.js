"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_schema_1 = require("./auth.schema");
const validate_1 = require("../../middleware/validate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Apply rate limiting and payload validation middleware to registration
router.post('/register', rateLimiter_1.registerLimiter, (0, validate_1.validateBody)(auth_schema_1.registerSchema), auth_controller_1.register);
// Apply rate limiting and payload validation middleware to login
router.post('/login', rateLimiter_1.loginLimiter, (0, validate_1.validateBody)(auth_schema_1.loginSchema), auth_controller_1.login);
// Standard logout endpoint
router.post('/logout', auth_controller_1.logout);
exports.default = router;
