import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { defineConfig, loadEnv, Plugin } from 'vite';

function fastApiDevServerPlugin(backendTarget: string): Plugin {
  let backendProcess: ChildProcess | null = null;

  function ensureBackendRunning() {
    if (backendProcess && !backendProcess.killed && backendProcess.exitCode === null) {
      return;
    }

    try {
      const url = new URL(backendTarget);
      const host = url.hostname || '127.0.0.1';
      const port = parseInt(url.port || '8000', 10);

      // Probe if backend is already listening
      const req = http.get(
        {
          hostname: host,
          port: port,
          path: '/api/health',
          timeout: 800,
        },
        (res) => {
          res.resume();
        }
      );

      req.on('error', () => {
        // Backend not listening; spawn uvicorn process
        if (backendProcess && !backendProcess.killed && backendProcess.exitCode === null) {
          return;
        }

        try {
          backendProcess = spawn('python3', [
            '-m',
            'uvicorn',
            'main:app',
            '--app-dir',
            'backend',
            '--host',
            host,
            '--port',
            port.toString(),
          ], {
            stdio: 'ignore',
            detached: false,
          });

          backendProcess.on('exit', () => {
            backendProcess = null;
          });

          backendProcess.on('error', () => {
            backendProcess = null;
          });
        } catch {
          backendProcess = null;
        }
      });
    } catch {
      // Invalid URL fallback
    }
  }

  return {
    name: 'fastapi-dev-server',
    configureServer(server) {
      // Initial startup check
      ensureBackendRunning();

      // Middleware hook to ensure backend is alive whenever /api is accessed
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/api')) {
          ensureBackendRunning();
        }
        next();
      });

      server.httpServer?.on('close', () => {
        if (backendProcess && !backendProcess.killed) {
          backendProcess.kill();
          backendProcess = null;
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Resolve target backend URL:
  // In the AI Studio container environment, port 8000 is occupied by internal control-plane-api.
  // The verified FastAPI backend runs on port 8005. Prevent conflicting BACKEND_URL from
  // routing to the control plane.
  let backendTarget = 'http://127.0.0.1:8005';
  if (env.BACKEND_URL && !env.BACKEND_URL.includes(':8000')) {
    backendTarget = env.BACKEND_URL;
  } else if (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes(':8000')) {
    backendTarget = process.env.BACKEND_URL;
  }

  return {
    plugins: [react(), tailwindcss(), fastApiDevServerPlugin(backendTarget)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Strip spurious Connection: upgrade header injected by the external Nginx reverse proxy
              proxyReq.removeHeader('upgrade');
              proxyReq.setHeader('connection', 'keep-alive');
            });
            proxy.on('error', (err, _req, res) => {
              // Prevent unhandled proxy ECONNREFUSED error from crashing or spamming console
              const serverRes = res as any;
              if (serverRes && !serverRes.headersSent && typeof serverRes.writeHead === 'function') {
                serverRes.writeHead(503, {
                  'Content-Type': 'application/json',
                });
                serverRes.end(
                  JSON.stringify({
                    error: true,
                    status: 'disconnected',
                    message: `Backend service is offline or unreachable at ${backendTarget} (${err.message})`,
                  })
                );
              }
            });
          },
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

