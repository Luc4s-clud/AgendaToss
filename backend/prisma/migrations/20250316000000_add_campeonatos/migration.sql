-- CreateTable
CREATE TABLE `Campeonato` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `modalidade` VARCHAR(191) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'inscricoes_abertas',
    `descricao` VARCHAR(191) NULL,
    `valorInscricao` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipe` (
    `id` VARCHAR(191) NOT NULL,
    `campeonatoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `responsavel` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partida` (
    `id` VARCHAR(191) NOT NULL,
    `campeonatoId` VARCHAR(191) NOT NULL,
    `quadraId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL,
    `horaInicio` VARCHAR(191) NULL,
    `equipe1Id` VARCHAR(191) NOT NULL,
    `equipe2Id` VARCHAR(191) NOT NULL,
    `placar1` INTEGER NULL,
    `placar2` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'agendada',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Equipe_campeonatoId_idx` ON `Equipe`(`campeonatoId`);

-- CreateIndex
CREATE INDEX `Partida_campeonatoId_idx` ON `Partida`(`campeonatoId`);

-- CreateIndex
CREATE INDEX `Partida_data_idx` ON `Partida`(`data`);

-- AddForeignKey
ALTER TABLE `Equipe` ADD CONSTRAINT `Equipe_campeonatoId_fkey` FOREIGN KEY (`campeonatoId`) REFERENCES `Campeonato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_campeonatoId_fkey` FOREIGN KEY (`campeonatoId`) REFERENCES `Campeonato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_quadraId_fkey` FOREIGN KEY (`quadraId`) REFERENCES `Quadra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_equipe1Id_fkey` FOREIGN KEY (`equipe1Id`) REFERENCES `Equipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partida` ADD CONSTRAINT `Partida_equipe2Id_fkey` FOREIGN KEY (`equipe2Id`) REFERENCES `Equipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
