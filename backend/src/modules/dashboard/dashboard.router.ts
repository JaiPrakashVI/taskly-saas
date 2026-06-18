import { Router } from 'express';
import { getDashboardData } from './dashboard.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Retrieve all aggregated stats and dashboard widgets (requires active JWT)
router.get('/', authenticateToken as any, getDashboardData as any);

export default router;
