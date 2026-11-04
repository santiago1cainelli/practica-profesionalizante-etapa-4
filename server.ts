import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './server/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Initialize DB immediately
  db.getData();

  // Logging API requests
  app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });

  // ==========================================
  // API Endpoints
  // ==========================================

  // Health and DB status
  app.get('/api/status', (req, res) => {
    const data = db.getData();
    res.json({
      status: 'ok',
      service: 'Club El Globo API & Database',
      version: data.version,
      updatedAt: data.updatedAt,
      counts: {
        socios: data.socios.length,
        cobradores: data.cobradores.length,
        instructores: data.instructores.length,
        lockers: data.lockers.length,
        actividades: data.actividades.length,
        cupones: data.cupones.length,
        rendiciones: data.rendiciones.length,
        asistencias: data.asistencias.length,
      },
    });
  });

  // Get full database (for quick sync on client mount)
  app.get('/api/database/all', (req, res) => {
    try {
      const data = db.getData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset database to initial seed
  app.post('/api/database/reset', async (req, res) => {
    try {
      const resetData = await db.reset();
      res.json({ message: 'Base de datos reiniciada con éxito', data: resetData });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SOCIOS ---
  app.get('/api/socios', (req, res) => {
    res.json(db.getSocios());
  });

  app.post('/api/socios', async (req, res) => {
    try {
      const nuevo = await db.addSocio(req.body);
      res.status(201).json(nuevo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/socios/:id', async (req, res) => {
    try {
      const updated = await db.updateSocio(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/socios/:id', async (req, res) => {
    try {
      const ok = await db.deleteSocio(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Socio no encontrado' });
      res.json({ success: true, message: 'Socio dado de baja correctamente' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/socios/:id/familiares', async (req, res) => {
    try {
      const familiar = await db.addFamiliar(req.params.id, req.body);
      res.status(201).json(familiar);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/socios/:id/familiares/:famId', async (req, res) => {
    try {
      const ok = await db.removeFamiliar(req.params.id, req.params.famId);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/socios/:id/regularizar', async (req, res) => {
    try {
      const socio = await db.regularizarDeuda(req.params.id);
      res.json(socio);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- COBRADORES ---
  app.get('/api/cobradores', (req, res) => {
    res.json(db.getCobradores());
  });

  app.post('/api/cobradores', async (req, res) => {
    try {
      const cob = await db.addCobrador(req.body);
      res.status(201).json(cob);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/cobradores/:id', async (req, res) => {
    try {
      const cob = await db.updateCobrador(req.params.id, req.body);
      res.json(cob);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/cobradores/:id', async (req, res) => {
    try {
      const ok = await db.deleteCobrador(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- INSTRUCTORES ---
  app.get('/api/instructores', (req, res) => {
    res.json(db.getInstructores());
  });

  app.post('/api/instructores', async (req, res) => {
    try {
      const inst = await db.addInstructor(req.body);
      res.status(201).json(inst);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/instructores/:id', async (req, res) => {
    try {
      const inst = await db.updateInstructor(req.params.id, req.body);
      res.json(inst);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/instructores/:id', async (req, res) => {
    try {
      const ok = await db.deleteInstructor(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- LOCKERS ---
  app.get('/api/lockers', (req, res) => {
    res.json(db.getLockers());
  });

  app.put('/api/lockers/:numero/assign', async (req, res) => {
    try {
      const { socioId } = req.body;
      const locker = await db.assignLocker(parseInt(req.params.numero, 10), socioId);
      res.json(locker);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/lockers/:numero/release', async (req, res) => {
    try {
      const locker = await db.releaseLocker(parseInt(req.params.numero, 10));
      res.json(locker);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/lockers/:numero/reserve', async (req, res) => {
    try {
      const locker = await db.reserveLocker(parseInt(req.params.numero, 10));
      res.json(locker);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- ACTIVIDADES ---
  app.get('/api/actividades', (req, res) => {
    res.json(db.getActividades());
  });

  app.post('/api/actividades/enroll', async (req, res) => {
    try {
      const { socioId, actividadId } = req.body;
      const result = await db.enrollActividad(socioId, actividadId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/actividades/unenroll', async (req, res) => {
    try {
      const { socioId, actividadId } = req.body;
      const result = await db.unenrollActividad(socioId, actividadId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CUPONES Y COBRANZAS ---
  app.get('/api/cupones', (req, res) => {
    res.json(db.getCupones());
  });

  app.post('/api/cupones/generar', async (req, res) => {
    try {
      const { socioId } = req.body;
      const cupon = await db.generarCupon(socioId);
      res.status(201).json(cupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/cupones/:id/pagar', async (req, res) => {
    try {
      const { metodoPago, cobradorId } = req.body;
      const cupon = await db.pagarCupon(req.params.id, metodoPago, cobradorId);
      res.json(cupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/cupones/:id/mora', async (req, res) => {
    try {
      const cupon = await db.aplicarMoraCupon(req.params.id);
      res.json(cupon);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- RENDICIONES ---
  app.get('/api/rendiciones', (req, res) => {
    res.json(db.getRendiciones());
  });

  app.post('/api/rendiciones', async (req, res) => {
    try {
      const rend = await db.addRendicion(req.body);
      res.status(201).json(rend);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/rendiciones/:id/aprobar', async (req, res) => {
    try {
      const rend = await db.aprobarRendicion(req.params.id);
      res.json(rend);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- ASISTENCIAS ---
  app.get('/api/asistencias', (req, res) => {
    res.json(db.getAsistencias());
  });

  app.post('/api/asistencias', async (req, res) => {
    try {
      const asist = await db.saveAsistencia(req.body);
      res.status(201).json(asist);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // Vite Middleware / Static Files
  // ==========================================
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Express + Vite Dev Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
