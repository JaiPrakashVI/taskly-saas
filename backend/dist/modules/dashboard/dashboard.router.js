"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Retrieve all aggregated stats and dashboard widgets (requires active JWT)
router.get('/', auth_1.authenticateToken, dashboard_controller_1.getDashboardData);
exports.default = router;
