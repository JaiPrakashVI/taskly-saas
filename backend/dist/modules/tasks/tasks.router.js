"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tasks_controller_1 = require("./tasks.controller");
const tasks_schema_1 = require("./tasks.schema");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
// Get tasks (supports filters, paging, sorting)
router.get('/', auth_1.authenticateToken, (0, validate_1.validateQuery)(tasks_schema_1.taskQuerySchema), tasks_controller_1.getTasks);
// Create task
router.post('/', auth_1.authenticateToken, (0, validate_1.validateBody)(tasks_schema_1.createTaskSchema), tasks_controller_1.createTask);
// Get task details
router.get('/:id', auth_1.authenticateToken, tasks_controller_1.getTaskById);
// Update task
router.put('/:id', auth_1.authenticateToken, (0, validate_1.validateBody)(tasks_schema_1.updateTaskSchema), tasks_controller_1.updateTask);
// Soft delete task
router.delete('/:id', auth_1.authenticateToken, tasks_controller_1.deleteTask);
exports.default = router;
