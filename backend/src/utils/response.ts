import { Response } from 'express';

// Standardized success response helper
export const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

// Standardized error response helper (never leaks stack traces to the client)
export const sendError = (res: Response, message: string, statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Standardized validation error helper
export const sendValidationError = (res: Response, errors: any[], message: string = "Validation failed") => {
  return res.status(400).json({
    success: false,
    message,
    errors,
  });
};
export type { Response };
