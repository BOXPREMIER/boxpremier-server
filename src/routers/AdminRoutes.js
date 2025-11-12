import express from 'express';
import { getBoxesByType, getWinesByType, getBoxesByWineType, exportOrdersCSV } from '../controllers/AdminController.js';
import { authenticate, checkRole } from '../middlewares/authMiddleware.js';

const AdminRouter = express.Router();

AdminRouter.use(authenticate);
AdminRouter.use(checkRole(['admin']));

AdminRouter.get('/metrics/boxes-by-type', getBoxesByType);
AdminRouter.get('/metrics/wines-by-type', getWinesByType);
AdminRouter.get('/metrics/boxes-by-wine-type', getBoxesByWineType);
AdminRouter.get('/orders/export-csv', exportOrdersCSV);

export default AdminRouter;