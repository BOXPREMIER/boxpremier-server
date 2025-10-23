import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { db_connection } from './src/database/db_connection.js';
import { HOST, PORT } from './src/config/config.js';

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
    console.log('✅ Connected successfully');
  } catch (error) {
    console.error('❌ Connection not successfully', error.message);
  }
}

export const server = app.listen(PORT, () => {
    console.log(`API running on http://${HOST}:${PORT}`)
})

initializeApp();

export default app;
