import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import weatherRoutes from './routes/weather.routes.js';
import routeRoutes from './routes/route.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/route', routeRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[MotoWeather] Backend demarré sur le port ${PORT}`);
  console.log(`[MotoWeather] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
