"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Registration validator with password requirements
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string()
        .trim()
        .toLowerCase()
        .email({ message: 'Invalid email address format.' }),
    password: zod_1.z.string()
        .min(8, { message: 'Password must be at least 8 characters long.' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
});
// Login validator
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string()
        .trim()
        .toLowerCase()
        .email({ message: 'Invalid email address format.' }),
    password: zod_1.z.string()
        .min(1, { message: 'Password is required.' }),
});
