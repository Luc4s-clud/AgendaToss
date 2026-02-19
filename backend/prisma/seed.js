import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.quadra.count();
  if (count > 0) {
    console.log('Quadras já existem, seed ignorado.');
    return;
  }
  await prisma.quadra.createMany({
    data: [
      { nome: 'Quadra 1', modalidade: 'volei', ativo: true },
      { nome: 'Quadra 2', modalidade: 'beach_tenis', ativo: true },
      { nome: 'Quadra 3', modalidade: 'futvolei', ativo: true },
    ],
  });
  console.log('Seed concluído: quadras criadas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
