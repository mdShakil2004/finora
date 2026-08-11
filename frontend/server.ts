import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = 3000;
const FASTAPI_PORT = 8001;

// Helper to check if FastAPI backend is healthy
function checkBackendHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${FASTAPI_PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Function to ensure Python FastAPI process is running
async function ensureBackendUp() {
  const isUp = await checkBackendHealth();
  if (!isUp) {
    console.log(`Starting Python FastAPI backend service on port ${FASTAPI_PORT}...`);
    const pythonProc = spawn(
      'python3',
      ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(FASTAPI_PORT)],
      {
        env: { ...process.env, PYTHONPATH: '.' },
        stdio: 'inherit',
      }
    );

    pythonProc.on('error', (err) => {
      console.error('Failed to start FastAPI process:', err);
    });

    // Wait for backend to be responsive
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkBackendHealth()) {
        console.log(`FastAPI backend is live on port ${FASTAPI_PORT}.`);
        break;
      }
    }
  } else {
    console.log(`FastAPI backend service is already running on port ${FASTAPI_PORT}.`);
  }
}

async function startServer() {
  const app = express();

  await ensureBackendUp();

  // Proxy /api requests to FastAPI backend on port 8001 without stripping /api path
  app.use(
    createProxyMiddleware({
      pathFilter: '/api',
      target: `http://127.0.0.1:${FASTAPI_PORT}`,
      changeOrigin: true,
    })
  );

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finora Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
