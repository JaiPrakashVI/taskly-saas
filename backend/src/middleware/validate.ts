import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

// Middleware to validate request body with Zod schemas.
// If validation fails, it converts Zod issues into a standardized client response format.
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        sendValidationError(res, formattedErrors, "Validation failed");
        return;
      }
      next(error);
    }
  };
};

// Middleware to validate request query parameters with Zod schemas.
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        sendValidationError(res, formattedErrors, "Query validation failed");
        return;
      }
      next(error);
    }
  };
};
