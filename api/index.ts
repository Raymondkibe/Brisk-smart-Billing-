import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../server/api';

const app = express();

// CORS middleware supporting https://brisksmartbilling.vercel.app and all authorized origins
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-business-id, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API router at both /api and root to handle Vercel rewrites reliably
app.use('/api', apiRouter);
app.use(apiRouter);

// Health / root endpoint
app.get(['/api', '/'], (_req: Request, res: Response) => {
  res.json({
    name: 'BRISK SMART BILLING API',
    status: 'online',
    version: '1.0.0',
    url: 'https://brisksmartbilling.vercel.app/',
    timestamp: new Date().toISOString(),
  });
});

export default app;

