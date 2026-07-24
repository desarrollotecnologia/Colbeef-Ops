import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import formatsRoutes from './routes/formats.routes';
import submissionsRoutes from './routes/submissions.routes';
import analyticsRoutes from './routes/analytics.routes';
import usersRoutes from './routes/users.routes';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'colbeef-ops', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/formats', formatsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/users', usersRoutes);

if (config.nodeEnv === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Colbeef-Ops API corriendo en http://localhost:${config.port}`);
});

export default app;
