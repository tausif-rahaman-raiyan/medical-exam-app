import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files directory
const wwwDir = path.join(__dirname, 'www');

// Serve static assets from www/
app.use(express.static(wwwDir));

// Health / Ping Route
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', app: 'Medical Secret Files', version: '2.0.0' });
});

// Fallback to index.html for SPA routing
app.use((req: Request, res: Response): void => {
  const reqPath = req.path;
  const targetFile = path.join(wwwDir, reqPath);
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    res.sendFile(targetFile);
    return;
  }
  res.sendFile(path.join(wwwDir, 'index.html'));
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`Medical Secret Files server listening at http://${HOST}:${PORT}`);
});
