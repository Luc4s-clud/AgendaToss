-- Adiciona coluna descricao na tabela Produto
ALTER TABLE `Produto` ADD COLUMN `descricao` VARCHAR(191) NULL AFTER `nome`;

