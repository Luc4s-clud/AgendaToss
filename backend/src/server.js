import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Health check (útil para PM2 e Hostinger)
app.get('/health', (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Teste de conexão com o banco
app.get('/api/db', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'connected' });
  } catch (e) {
    res.status(500).json({ db: 'error', message: e.message });
  }
});

// Rotas de quadras (exemplo)
app.get('/api/quadras', async (_, res) => {
  try {
    const quadras = await prisma.quadra.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
    res.json(quadras);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
