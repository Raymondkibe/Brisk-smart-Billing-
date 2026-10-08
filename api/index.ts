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

// URL path normalizer for Vercel rewrites
app.use((req: Request, _res: Response, next: NextFunction) => {
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-now-route-matches'] as string);
  if (matchedPath && req.url.startsWith('/api/index.js')) {
    req.url = matchedPath;
  }
  next();
});

// Safe body parser that does not hang on Vercel if body was already parsed
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.json()(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true })(req, res, next);
  });
});

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

// Primary Vercel serverless request handler with Promise resolution
export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    res.on('finish', () => resolve(null));
    res.on('close', () => resolve(null));
    app(req, res, (err: any) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
      }
      resolve(null);
    });
  });
}
