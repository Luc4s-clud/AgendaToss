import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3333;
const VALOR_QUADRA_POR_HORA = 80;

app.use(cors());
app.use(express.json());

/** Valida se a conexão com o banco está ok (usa no startup e nos endpoints) */
async function validarConexaoBanco() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

// Health check: inclui status do banco (útil para PM2 e monitoramento)
app.get('/health', async (_, res) => {
  const db = await validarConexaoBanco();
  const ok = db.ok;
  res.status(ok ? 200 : 503).json({
    ok,
    timestamp: new Date().toISOString(),
    db: ok ? 'connected' : 'error',
    ...(db.message && { dbMessage: db.message }),
  });
});

// Teste explícito de conexão com o banco
app.get('/api/db', async (_, res) => {
  const db = await validarConexaoBanco();
  if (db.ok) {
    res.json({ db: 'connected' });
  } else {
    res.status(500).json({ db: 'error', message: db.message });
  }
});

// Quadras
app.get('/api/quadras', async (_, res) => {
  try {
    const quadras = await prisma.quadra.findMany({ orderBy: { nome: 'asc' } });
    res.json(quadras);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Agendamentos (query: data, quadraId)
app.get('/api/agendamentos', async (req, res) => {
  try {
    const { data, quadraId } = req.query;
    const where = {};
    if (data) {
      const d = new Date(data);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      where.data = { gte: start, lte: end };
    }
    if (quadraId) where.quadraId = quadraId;
    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: { quadra: true },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
    });
    res.json(agendamentos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Criar agendamento
app.post('/api/agendamentos', async (req, res) => {
  try {
    const { quadraId, data, horaInicio, horaFim, cliente, telefone, valor } = req.body;
    if (!quadraId || !data || !horaInicio || !horaFim) {
      return res.status(400).json({ error: 'Faltam campos: quadraId, data, horaInicio, horaFim' });
    }
    const valorHora = valor != null ? Number(valor) : VALOR_QUADRA_POR_HORA;
    const dataObj = new Date(data);
    const agendamento = await prisma.agendamento.create({
      data: {
        quadraId,
        data: dataObj,
        horaInicio: String(horaInicio).replace(':', ''),
        horaFim: String(horaFim).replace(':', ''),
        cliente: cliente || null,
        telefone: telefone || null,
        valor: valorHora,
      },
    });
    const withQuadra = await prisma.agendamento.findUnique({
      where: { id: agendamento.id },
      include: { quadra: true },
    });
    res.status(201).json(withQuadra);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cancelar (deletar) agendamento
app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    await prisma.agendamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Agendamento não encontrado' });
    res.status(500).json({ error: e.message });
  }
});

// Comandas (query: status = aberta | fechada | paga)
app.get('/api/comandas', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const comandas = await prisma.comanda.findMany({
      where,
      include: { itens: { include: { produto: true } } },
      orderBy: { numero: 'desc' },
    });
    res.json(comandas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Próximo número de comanda (para cadastro)
app.get('/api/comandas/proximo-numero', async (_, res) => {
  try {
    const last = await prisma.comanda.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    res.json({ proximoNumero: last ? last.numero + 1 : 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Criar comanda (número do cartão + mesa opcional)
app.post('/api/comandas', async (req, res) => {
  try {
    const { numero, mesa } = req.body;
    if (numero == null) {
      return res.status(400).json({ error: 'Campo numero é obrigatório' });
    }
    const num = Number(numero);
    if (isNaN(num) || num < 1) {
      return res.status(400).json({ error: 'Número da comanda deve ser um inteiro positivo' });
    }
    const existente = await prisma.comanda.findFirst({
      where: { numero: num, status: 'aberta' },
    });
    if (existente) {
      return res.status(400).json({ error: `Já existe comanda aberta com número ${num}` });
    }
    const comanda = await prisma.comanda.create({
      data: {
        numero: num,
        mesa: mesa ? String(mesa).trim() || null : null,
      },
    });
    const withItens = await prisma.comanda.findUnique({
      where: { id: comanda.id },
      include: { itens: { include: { produto: true } } },
    });
    res.status(201).json(withItens);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Uma comanda (para editar itens)
app.get('/api/comandas/:id', async (req, res) => {
  try {
    const comanda = await prisma.comanda.findUnique({
      where: { id: req.params.id },
      include: { itens: { include: { produto: true } } },
    });
    if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' });
    res.json(comanda);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Atualizar comanda (fechar ou marcar como paga)
app.patch('/api/comandas/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['aberta', 'fechada', 'paga'].includes(status)) {
      return res.status(400).json({ error: 'status deve ser: aberta, fechada ou paga' });
    }
    const data = { status };
    if (status === 'fechada') {
      data.fechadaEm = new Date();
    }
    const comanda = await prisma.comanda.update({
      where: { id: req.params.id },
      data,
      include: { itens: { include: { produto: true } } },
    });
    res.json(comanda);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Comanda não encontrada' });
    res.status(500).json({ error: e.message });
  }
});

// Adicionar item à comanda (desconta do estoque)
app.post('/api/comandas/:comandaId/itens', async (req, res) => {
  try {
    const { comandaId } = req.params;
    const { produtoId, quantidade } = req.body;
    if (!produtoId || quantidade == null) {
      return res.status(400).json({ error: 'Faltam: produtoId, quantidade' });
    }
    const qty = Number(quantidade);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { itens: true },
    });
    if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (comanda.status !== 'aberta') {
      return res.status(400).json({ error: 'Só é possível adicionar itens em comanda aberta' });
    }

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    if (!produto.ativo) return res.status(400).json({ error: 'Produto inativo' });
    if (produto.controleEstoque) {
      const estoque = Number(produto.estoqueAtual);
      if (estoque < qty) {
        return res.status(400).json({ error: `Estoque insuficiente. Disponível: ${estoque} ${produto.unidade}` });
      }
    }

    const precoUnit = Number(produto.preco);
    const subtotal = precoUnit * qty;
    const novoTotal = Number(comanda.valorTotal) + subtotal;

    await prisma.$transaction([
      prisma.itemComanda.create({
        data: {
          comandaId,
          produtoId,
          quantidade: qty,
          precoUnit,
          subtotal,
        },
      }),
      prisma.comanda.update({
        where: { id: comandaId },
        data: { valorTotal: novoTotal },
      }),
      ...(produto.controleEstoque
        ? [
            prisma.movimentacaoEstoque.create({
              data: {
                produtoId,
                tipo: 'saida',
                quantidade: qty,
                motivo: `Comanda #${comanda.numero}`,
              },
            }),
            prisma.produto.update({
              where: { id: produtoId },
              data: { estoqueAtual: Number(produto.estoqueAtual) - qty },
            }),
          ]
        : []),
    ]);

    const atualizada = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { itens: { include: { produto: true } } },
    });
    res.status(201).json(atualizada);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remover item da comanda (devolve ao estoque)
app.delete('/api/comandas/:comandaId/itens/:itemId', async (req, res) => {
  try {
    const { comandaId, itemId } = req.params;

    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { itens: true },
    });
    if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' });
    if (comanda.status !== 'aberta') {
      return res.status(400).json({ error: 'Só é possível remover itens de comanda aberta' });
    }

    const item = await prisma.itemComanda.findFirst({
      where: { id: itemId, comandaId },
      include: { produto: true },
    });
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

    const qty = Number(item.quantidade);
    const subtotal = Number(item.subtotal);
    const novoTotal = Math.max(0, Number(comanda.valorTotal) - subtotal);
    const produto = item.produto;

    await prisma.$transaction([
      prisma.itemComanda.delete({ where: { id: itemId } }),
      prisma.comanda.update({
        where: { id: comandaId },
        data: { valorTotal: novoTotal },
      }),
      ...(produto.controleEstoque
        ? [
            prisma.movimentacaoEstoque.create({
              data: {
                produtoId: produto.id,
                tipo: 'entrada',
                quantidade: qty,
                motivo: `Devolução comanda #${comanda.numero}`,
              },
            }),
            prisma.produto.update({
              where: { id: produto.id },
              data: { estoqueAtual: Number(produto.estoqueAtual) + qty },
            }),
          ]
        : []),
    ]);

    const atualizada = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { itens: { include: { produto: true } } },
    });
    res.json(atualizada);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Estoque: Produtos ----
app.get('/api/produtos', async (req, res) => {
  try {
    const { ativo } = req.query;
    const where = ativo !== undefined ? { ativo: ativo === '1' || ativo === 'true' } : {};
    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
    res.json(produtos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, preco, unidade, controleEstoque } = req.body;
    if (!nome || preco == null) {
      return res.status(400).json({ error: 'Faltam campos: nome, preco' });
    }
    const produto = await prisma.produto.create({
      data: {
        nome: String(nome),
        preco: Number(preco),
        unidade: unidade ?? 'UN',
        controleEstoque: controleEstoque !== false,
      },
    });
    res.status(201).json(produto);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/produtos/:id', async (req, res) => {
  try {
    const { nome, preco, unidade, controleEstoque, ativo } = req.body;
    const data = {};
    if (nome !== undefined) data.nome = String(nome);
    if (preco !== undefined) data.preco = Number(preco);
    if (unidade !== undefined) data.unidade = String(unidade);
    if (controleEstoque !== undefined) data.controleEstoque = Boolean(controleEstoque);
    if (ativo !== undefined) data.ativo = Boolean(ativo);
    const produto = await prisma.produto.update({
      where: { id: req.params.id },
      data,
    });
    res.json(produto);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produto não encontrado' });
    res.status(500).json({ error: e.message });
  }
});

// ---- Estoque: Movimentações ----
app.get('/api/movimentacoes', async (req, res) => {
  try {
    const { produtoId } = req.query;
    const where = produtoId ? { produtoId } : {};
    const movimentacoes = await prisma.movimentacaoEstoque.findMany({
      where,
      include: { produto: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(movimentacoes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/movimentacoes', async (req, res) => {
  try {
    const { produtoId, tipo, quantidade, motivo } = req.body;
    if (!produtoId || !tipo || quantidade == null) {
      return res.status(400).json({ error: 'Faltam campos: produtoId, tipo (entrada|saida|ajuste), quantidade' });
    }
    const tipoSafe = String(tipo).toLowerCase();
    if (!['entrada', 'saida', 'ajuste'].includes(tipoSafe)) {
      return res.status(400).json({ error: 'tipo deve ser: entrada, saida ou ajuste' });
    }
    const qty = Number(quantidade);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'quantidade deve ser um número >= 0' });
    }

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

    let novoEstoque = Number(produto.estoqueAtual);
    if (tipoSafe === 'entrada') novoEstoque += qty;
    else if (tipoSafe === 'saida') {
      novoEstoque -= qty;
      if (novoEstoque < 0) return res.status(400).json({ error: 'Estoque insuficiente' });
    } else novoEstoque = qty;

    const [mov] = await prisma.$transaction([
      prisma.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: tipoSafe,
          quantidade: tipoSafe === 'ajuste' ? novoEstoque : qty,
          motivo: motivo || null,
        },
      }),
      prisma.produto.update({
        where: { id: produtoId },
        data: { estoqueAtual: novoEstoque },
      }),
    ]);
    const withProduto = await prisma.movimentacaoEstoque.findUnique({
      where: { id: mov.id },
      include: { produto: true },
    });
    res.status(201).json(withProduto);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Financeiro (receita quadras + bar) ----
app.get('/api/financeiro', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00.000Z') : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = dataFim ? new Date(dataFim + 'T23:59:59.999Z') : new Date();

    const [agendamentos, comandasPagas] = await Promise.all([
      prisma.agendamento.findMany({
        where: {
          data: { gte: inicio, lte: fim },
        },
        include: { quadra: true },
        orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      }),
      prisma.comanda.findMany({
        where: {
          status: 'paga',
          updatedAt: { gte: inicio, lte: fim },
        },
        include: { itens: { include: { produto: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const totalQuadras = agendamentos.reduce((s, a) => s + Number(a.valor), 0);
    const totalBar = comandasPagas.reduce((s, c) => s + Number(c.valorTotal), 0);

    res.json({
      quadras: {
        total: totalQuadras,
        quantidade: agendamentos.length,
        valorHora: VALOR_QUADRA_POR_HORA,
        itens: agendamentos,
      },
      bar: {
        total: totalBar,
        quantidade: comandasPagas.length,
        itens: comandasPagas,
      },
      totalGeral: totalQuadras + totalBar,
      periodo: { dataInicio: inicio.toISOString().slice(0, 10), dataFim: fim.toISOString().slice(0, 10) },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sobe o servidor só após validar conexão com o banco
async function iniciar() {
  const db = await validarConexaoBanco();
  if (!db.ok) {
    console.error('[FATAL] Não foi possível conectar ao banco de dados:', db.message);
    process.exit(1);
  }
  console.log('Banco de dados: conexão OK');

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

iniciar();
