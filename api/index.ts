import express, { Request, Response } from 'express';
import { apiRouter } from '../server/api';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API router at /api
app.use('/api', apiRouter);

// Health / root endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'BRISK SMART BILLING API',
    status: 'online',
    version: '1.0.0',
    url: 'https://brisksmartbilling.vercel.app/',
    timestamp: new Date().toISOString(),
  });
});

export default app;
