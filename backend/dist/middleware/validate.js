"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
// Middleware to validate request body with Zod schemas.
// If validation fails, it converts Zod issues into a standardized client response format.
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                (0, response_1.sendValidationError)(res, formattedErrors, "Validation failed");
                return;
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
// Middleware to validate request query parameters with Zod schemas.
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                (0, response_1.sendValidationError)(res, formattedErrors, "Query validation failed");
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
