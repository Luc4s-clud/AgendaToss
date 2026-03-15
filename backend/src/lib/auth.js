import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-dev-alterar-em-producao';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export function hashSenha(senha) {
  return bcrypt.hashSync(senha, 10);
}

export function compararSenha(senha, hash) {
  return bcrypt.compareSync(senha, hash);
}

export function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
