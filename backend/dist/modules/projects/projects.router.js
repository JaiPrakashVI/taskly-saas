"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projects_controller_1 = require("./projects.controller");
const projects_schema_1 = require("./projects.schema");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
// Get all projects for authenticated user (supports filters and paging)
router.get('/', auth_1.authenticateToken, (0, validate_1.validateQuery)(projects_schema_1.projectQuerySchema), projects_controller_1.getProjects);
// Create a new project for authenticated user
router.post('/', auth_1.authenticateToken, (0, validate_1.validateBody)(projects_schema_1.createProjectSchema), projects_controller_1.createProject);
// Get specific project details (verifies owner)
router.get('/:id', auth_1.authenticateToken, projects_controller_1.getProjectById);
// Update a project (verifies owner)
router.put('/:id', auth_1.authenticateToken, (0, validate_1.validateBody)(projects_schema_1.updateProjectSchema), projects_controller_1.updateProject);
// Soft delete a project (verifies owner)
router.delete('/:id', auth_1.authenticateToken, projects_controller_1.deleteProject);
exports.default = router;
