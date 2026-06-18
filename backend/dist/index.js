"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const projects_router_1 = __importDefault(require("./modules/projects/projects.router"));
const tasks_router_1 = __importDefault(require("./modules/tasks/tasks.router"));
const dashboard_router_1 = __importDefault(require("./modules/dashboard/dashboard.router"));
const response_1 = require("./utils/response");
// Load environment configurations
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    // In production, we'd lock this down, but for development and demo builds, allow cross-origin requests
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Parsers
app.use(express_1.default.json());
// API Routes
app.use('/api/auth', auth_router_1.default);
app.use('/api/projects', projects_router_1.default);
app.use('/api/tasks', tasks_router_1.default);
app.use('/api/dashboard', dashboard_router_1.default);
// Basic Health Check / Root endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Keel API is running.' });
});
// Catch-all route for unhandled requests (404)
app.use((req, res) => {
    (0, response_1.sendError)(res, 'Requested resource not found.', 404);
});
// Global Error Handling Middleware
// This acts as a final safety net, shielding the frontend from database exceptions or raw stack traces.
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    (0, response_1.sendError)(res, 'Internal server error occurred.', 500);
});
// Start the Express server
app.listen(PORT, () => {
    console.log(`[Keel Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
