// gerarPropostaPdf.js
import fs from 'fs';
import PDFDocument from 'pdfkit';

const outputPath = './proposta-agenda-fut-show.pdf';

const doc = new PDFDocument({
  size: 'A4',
  margin: 50,
});

// stream para arquivo
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// ========== CONFIG BÁSICA DE CORES ==========
const colors = {
  brand: '#F6B800',      // amarelo principal
  brandDark: '#B27D00',
  bgDark: '#0F1721',     // fundo escuro
  textLight: '#F9FAFB',
  textMuted: '#9CA3AF',
  borderSoft: '#1F2933',
};

// Funções utilitárias
function addHeaderLogoTitle() {
  // Faixa de topo
  doc.save()
    .rect(0, 0, doc.page.width, 80)
    .fill(colors.bgDark);

  // “logo” textual (pode trocar por imagem se quiser)
  doc
    .fillColor(colors.brand)
    .fontSize(16)
    .text('Agenda Fut Show', 50, 30, { align: 'left' })
    .moveDown(0.2);

  doc
    .fillColor(colors.textLight)
    .fontSize(9)
    .text('Sistema de gestão para arenas de areia', { align: 'left' });

  doc.restore();
}

function addFooter(pageLabel = '') {
  const bottom = doc.page.height - 40;
  doc
    .fontSize(8)
    .fillColor(colors.textMuted)
    .text('Agenda Fut Show • Proposta Comercial', 50, bottom, { align: 'left' });

  if (pageLabel) {
    doc
      .fontSize(8)
      .fillColor(colors.textMuted)
      .text(pageLabel, -50, bottom, { align: 'right' });
  }
}

// ========== CAPA ==========
function drawCover() {
  // Fundo inteiro escuro
  doc.save()
    .rect(0, 0, doc.page.width, doc.page.height)
    .fill(colors.bgDark)
    .restore();

  // “vinheta” degradê lateral
  const centerX = doc.page.width * 0.7;
  doc
    .save()
    .circle(centerX, 200, 220)
    .fillOpacity(0.25)
    .fill(colors.brand)
    .restore();

  // Título principal
  doc
    .fillColor(colors.textLight)
    .fontSize(26)
    .text('Proposta Comercial', 60, 120);

  doc
    .fillColor(colors.brand)
    .fontSize(34)
    .moveDown(0.8)
    .text('Agenda Fut Show', { align: 'left' });

  doc
    .fillColor(colors.textMuted)
    .fontSize(12)
    .moveDown(0.8)
    .text(
      'Sistema completo para agendamento de quadras, gestão da copa/bar,\n' +
        'controle de estoque e visão financeira da sua arena.',
      { align: 'left' }
    );

  // Rodapé da capa
  doc
    .fontSize(9)
    .fillColor(colors.textMuted)
    .text(
      'Documento confidencial – uso exclusivo para apresentação de proposta comercial.',
      60,
      doc.page.height - 80
    );
}

// ========== PÁGINA 2 ==========
function drawDetailsPage() {
  doc.addPage({ margin: 50 });

  addHeaderLogoTitle();

  doc.moveDown(4); // pular a faixa do topo

  // 1. Visão geral
  doc
    .fontSize(14)
    .fillColor('#000000')
    .text('1. Visão geral do sistema', { underline: true })
    .moveDown(0.7);

  doc
    .fontSize(11)
    .fillColor('#333333')
    .list(
      [
        'Agendamento de quadras (Beach Tennis, Vôlei e Futvôlei) com controle visual de horários livres e ocupados.',
        'Tela de "Meus agendamentos" para o operador ver, cancelar e marcar pagamentos com rapidez.',
        'Módulo completo de copa/bar com comandas, itens, fechamento e registro de pagamento no caixa.',
        'Controle de estoque integrado: entradas, saídas e ajustes, com baixa automática pela venda nas comandas.',
        'Painel financeiro resumindo faturamento de quadras e bar, com gráficos por ano, mês e últimos 7 dias.',
      ],
      { bulletRadius: 2 }
    )
    .moveDown(1.2);

  // 2. Condições comerciais
  doc
    .fontSize(14)
    .fillColor('#000000')
    .text('2. Condições comerciais', { underline: true })
    .moveDown(0.7);

  // Opção 1
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text('Opção 1 – Mensalidade (implantação + uso mensal)')
    .moveDown(0.3);

  doc
    .fontSize(11)
    .fillColor('#333333')
    .text('• Taxa de implantação (apenas no primeiro mês): R$ 500,00')
    .text('• Mensalidade fixa de uso/infra: R$ 175,00 a partir do segundo mês')
    .moveDown(0.5)
    .text('Fluxo sugerido:', { underline: true })
    .moveDown(0.2)
    .list(
      [
        'Mês 1: implantação do sistema, configuração inicial e treinamento, cobrados na taxa de R$ 500,00.',
        'A partir do mês 2: apenas a mensalidade fixa de R$ 175,00 para manter o sistema online, com suporte e pequenas melhorias.',
      ],
      { bulletRadius: 2 }
    )
    .moveDown(0.8)
    .text(
      'Indicada para arenas que desejam manter um acompanhamento contínuo e suporte ativo, ' +
        'com espaço para ajustes pontuais conforme o uso diário.',
      { align: 'left' }
    )
    .moveDown(1.2);

  // Opção 2
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text('Opção 2 – Aquisição do app (licença definitiva)')
    .moveDown(0.3);

  doc
    .fontSize(11)
    .fillColor('#333333')
    .text('• Pagamento único pela licença: R$ 2.500,00 (podendo ser parcelado)')
    .text('• Mensalidade fixa anual de suporte/infra: R$ 300,00')
    .moveDown(0.5)
    .text(
      'Indicada para quem quer ter o sistema como ativo do negócio: paga uma vez pela solução ' +
        'e mantém apenas um custo anual baixo de suporte e infraestrutura.',
      { align: 'left' }
    )
    .moveDown(1.2);

  // 3. Benefícios
  doc
    .fontSize(14)
    .fillColor('#000000')
    .text('3. Benefícios para a arena', { underline: true })
    .moveDown(0.7);

  doc
    .fontSize(11)
    .fillColor('#333333')
    .list(
      [
        'Fim de conflitos de horário: todos os agendamentos registrados no sistema, inclusive pelo celular.',
        'Atendimento mais rápido na copa/bar, com controle de comandas e estoque em tempo real.',
        'Diminuição de perdas e “sumiços” de produto, graças ao vínculo entre venda e estoque.',
        'Leitura clara do financeiro, facilitando decisões sobre preços, horários nobres e promoções.',
        'Imagem profissional: seus clientes percebem organização e tecnologia ao usar o sistema.',
      ],
      { bulletRadius: 2 }
    )
    .moveDown(1.2);

  // 4. Por que adquirir o app em vez de ficar só na mensalidade
  doc
    .fontSize(14)
    .fillColor('#000000')
    .text('4. Por que adquirir o app (Opção 2)', { underline: true })
    .moveDown(0.7);

  doc
    .fontSize(11)
    .fillColor('#333333')
    .list(
      [
        'Investimento concentrado: você paga uma vez (R$ 2.500,00) e reduz o custo mensal recorrente.',
        'Previsibilidade: a única recorrência significativa é a anuidade reduzida de R$ 300,00.',
        'Você tem o sistema completo disponível, sem depender de manter uma mensalidade alta para continuar usando.',
        'Perfeito para arenas que já sabem o que precisam e não exigem grandes mudanças a cada mês.',
      ],
      { bulletRadius: 2 }
    )
    .moveDown(1.4);

  doc
    .fontSize(10)
    .fillColor('#777777')
    .text(
      'Observação: valores podem ser ajustados conforme necessidades específicas, integrações adicionais ou ' +
        'mudanças de escopo combinadas entre as partes.',
      { align: 'left' }
    );

  addFooter('Página 2');
}

// ==== Geração efetiva ====
drawCover();
drawDetailsPage();

doc.end();

stream.on('finish', () => {
  console.log(`PDF gerado em: ${outputPath}`);
});