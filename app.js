import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { db_connection } from './src/database/db_connection.js';
import { HOST, PORT } from './src/config/config.js';
import AuthRoutes from './src/routers/AuthRoutes.js';
import UserRoutes from './src/routers/UserRoutes.js';
import OrderRoutes from './src/routers/OrderRoutes.js';
import SubsRouter from './src/routers/SubscriptionsRoutes.js';
import PaymentRoutes from './src/routers/PaymentRoutes.js'
import PlanRouter from './src/routers/SubscriptionPlanRoutes.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Guard de Content-Type
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type debe ser application/json' });
  }
  next();
});

// Basic Routes
app.get('/', (_req, res) => res.send('Hola API'));

async function initializeApp() {
  try {
    await db_connection();
    console.log('✅ MongoDB: Connected successfully');
  } catch (error) {
    console.error('❌ MongoDB: Connection not successfully', error.message);
  }
}

//routes
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/api/subs', SubsRouter);
app.use('/api/payments', PaymentRoutes);
app.use('/api/plans', PlanRouter);

export const server = app.listen(PORT, () => {
  console.log(`API running on http://${HOST}:${PORT}`)
})

initializeApp();

export default app;
