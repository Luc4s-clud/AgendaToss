import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Usuário admin (senha: admin123) — criar se não existir
  const adminEmail = 'admin@agendafutshow.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const senhaHash = bcrypt.hashSync('admin123', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        senhaHash,
        nome: 'Administrador',
        role: 'ADMIN',
        ativo: true,
      },
    });
    console.log('Usuário admin criado:', admin.email, '(senha: admin123)');
  }

  // Usuário comum (senha: usuario123) — criar se não existir
  const userEmail = 'usuario@agendafutshow.com';
  let usuario = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!usuario) {
    const senhaHash = bcrypt.hashSync('usuario123', 10);
    usuario = await prisma.user.create({
      data: {
        email: userEmail,
        senhaHash,
        nome: 'Usuário',
        role: 'USUARIO',
        ativo: true,
      },
    });
    console.log('Usuário comum criado:', usuario.email, '(senha: usuario123)');
  }

  // Quadras — criar só se não houver nenhuma
  const count = await prisma.quadra.count();
  if (count === 0) {
    await prisma.quadra.createMany({
      data: [
        { nome: 'Quadra 1', modalidade: 'volei', ativo: true },
        { nome: 'Quadra 2', modalidade: 'beach_tenis', ativo: true },
        { nome: 'Quadra 3', modalidade: 'futvolei', ativo: true },
      ],
    });
    console.log('Quadras criadas.');
  }
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
