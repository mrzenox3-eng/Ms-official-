import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parser with 25MB limit for screenshots/attachments
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure backend uploads directory exists for storing screenshots
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const uploadSubdirs = ['screenshots', 'payments', 'support', 'general'];
  try {
    const fs = await import('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    for (const sub of uploadSubdirs) {
      const subPath = path.join(uploadsDir, sub);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
      }
    }
  } catch (dirErr) {
    console.warn('[Server] Notice during uploads dir initialization:', dirErr);
  }

  // Serve backend screenshot uploads statically
  app.use('/uploads', express.static(uploadsDir));

  // Mount API router
  app.use('/api', apiRouter);

  // In development, hook Vite middleware
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MS Official] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
