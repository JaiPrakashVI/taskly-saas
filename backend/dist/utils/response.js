"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendValidationError = exports.sendError = exports.sendSuccess = void 0;
// Standardized success response helper
const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
    });
};
exports.sendSuccess = sendSuccess;
// Standardized error response helper (never leaks stack traces to the client)
const sendError = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.sendError = sendError;
// Standardized validation error helper
const sendValidationError = (res, errors, message = "Validation failed") => {
    return res.status(400).json({
        success: false,
        message,
        errors,
    });
};
exports.sendValidationError = sendValidationError;
