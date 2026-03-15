import { verificarToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

/**
 * Extrai o token do header Authorization (Bearer) e define req.user se válido.
 * Não retorna erro se não houver token - use requireAuth para exigir login.
 */
export async function authOptional(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  const payload = verificarToken(token);
  if (!payload?.userId) {
    req.user = null;
    return next();
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, nome: true, role: true, ativo: true },
    });
    req.user = user?.ativo ? user : null;
  } catch {
    req.user = null;
  }
  next();
}

/** Exige usuário autenticado. Retorna 401 se não houver token ou usuário inválido. */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado. Faça login.' });
  }
  next();
}

/** Exige perfil ADMIN. Deve ser usado após requireAuth. Retorna 403 se não for admin. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
}
