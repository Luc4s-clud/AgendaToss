# Criar o banco de dados na VPS Linux (Hostinger)

Este guia mostra como **instalar o MySQL na sua VPS Linux** (Hostinger) e deixar o banco pronto para a API do Agenda TOSS.

---

## Visão geral

1. Conectar na VPS por SSH  
2. Instalar o MySQL (ou MariaDB) no servidor  
3. Criar o banco e um usuário para a aplicação  
4. Configurar o backend e aplicar as tabelas com Prisma  

---

## 1. Conectar na VPS (SSH)

No seu PC (PowerShell ou terminal):

```bash
ssh root@ip_da_sua_vps
```

(Ou use o usuário que a Hostinger forneceu, ex.: `u123456789`.)

---

## 2. Instalar o MySQL na VPS

A VPS Hostinger costuma ser **Ubuntu** ou **Debian**. Use os comandos abaixo conforme o caso.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y mysql-server
```

### Iniciar e habilitar o MySQL

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

Confirme que está rodando:

```bash
sudo systemctl status mysql
```

(deve mostrar `active (running)`).

---

## 3. Configurar segurança do MySQL

### 3.1 Ajuste de segurança inicial (recomendado)

```bash
sudo mysql_secure_installation
```

- Definir senha para o usuário **root**: escolha **Yes** e crie uma senha forte (guarde para administração).
- Remover usuários anônimos: **Y**
- Desabilitar login root remotamente: **Y**
- Remover banco de teste: **Y**
- Recarregar privilégios: **Y**

### 3.2 Criar banco e usuário para a aplicação

Entre no MySQL como root:

```bash
sudo mysql -u root -p
```

(Digite a senha do root que você definiu.)

No prompt do MySQL (`mysql>`), rode os comandos abaixo **trocando**:

- `agenda_toss` → nome do banco (pode manter)
- `agenda_user` → nome do usuário da aplicação
- `SuaSenhaForteAqui` → senha forte para esse usuário

```sql
CREATE DATABASE agenda_toss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agenda_user'@'localhost' IDENTIFIED BY 'SuaSenhaForteAqui';
GRANT ALL PRIVILEGES ON agenda_toss.* TO 'agenda_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Teste a conexão com o novo usuário:

```bash
mysql -u agenda_user -p agenda_toss -e "SELECT 1;"
```

Se aparecer um resultado com `1`, está ok. Saia com `exit` se abrir o cliente.

---

## 4. Configurar o backend na VPS

### 4.1 Ir até a pasta do backend

Se o projeto já estiver clonado (ex. em `~/agenda-toss` ou `~/AgendaToss`):

```bash
cd ~/agenda-toss/backend
```

(Se ainda não clonou, clone antes com `git clone ...` e entre na pasta `backend`.)

### 4.2 Criar o arquivo `.env`

```bash
cp .env.example .env
nano .env
```

Use a `DATABASE_URL` apontando para o **MySQL local** na VPS (localhost):

```env
NODE_ENV=production
PORT=3333
DATABASE_URL="mysql://agenda_user:SuaSenhaForteAqui@localhost:3306/agenda_toss"
```

**Importante:** troque `agenda_user` e `SuaSenhaForteAqui` pelos mesmos usuário e senha que você criou no passo 3.2.  
Se a senha tiver caracteres especiais (`@`, `#`, `%`), codifique na URL (ex.: `@` → `%40`).

Salve: `Ctrl+O`, Enter. Saia: `Ctrl+X`.

### 4.3 Instalar dependências e gerar o Prisma Client

```bash
npm install --production
npx prisma generate
```

### 4.4 Aplicar as migrações (criar as tabelas)

Este comando cria todas as tabelas no banco `agenda_toss`:

```bash
npx prisma migrate deploy
```

Se aparecer que as migrações foram aplicadas (ou "No pending migrations"), está correto.

### 4.5 (Opcional) Dados iniciais (quadras)

```bash
npm run db:seed
```

### 4.6 Subir a API com PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

(Siga a mensagem do `pm2 startup` se pedir um comando para colar.)

---

## Resumo dos comandos (na ordem)

**No MySQL (após instalar e rodar `mysql_secure_installation`):**

```bash
sudo mysql -u root -p
```

Dentro do MySQL:

```sql
CREATE DATABASE agenda_toss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agenda_user'@'localhost' IDENTIFIED BY 'SuaSenhaForteAqui';
GRANT ALL PRIVILEGES ON agenda_toss.* TO 'agenda_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**No backend (pasta do projeto na VPS):**

```bash
cd ~/agenda-toss/backend
cp .env.example .env
nano .env   # DATABASE_URL com mysql://agenda_user:SENHA@localhost:3306/agenda_toss
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run db:seed              # opcional
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## Conferir se está tudo ok

- **MySQL rodando:** `sudo systemctl status mysql`
- **API:** na VPS: `curl http://localhost:3333/health` e `curl http://localhost:3333/api/db`

---

## Problemas comuns

| Problema | O que fazer |
|----------|-------------|
| `Access denied for user` | Confirme usuário e senha no `.env`. Verifique se o usuário foi criado com `'agenda_user'@'localhost'` e se tem `GRANT` em `agenda_toss.*`. |
| `REFERENCES command denied` (P3018) | O usuário MySQL precisa de **todos** os privilégios no banco (incluindo REFERENCES). Veja [Erro P3018 – REFERENCES denied](#erro-p3018--references-denied) abaixo. |
| `Can't connect to MySQL server` | Verifique se o MySQL está ativo: `sudo systemctl status mysql`. Use `localhost` (e não `127.0.0.1`) na URL se der diferença. |
| Senha com `@`, `#`, `%` | Codifique na URL: `@` → `%40`, `#` → `%23`, `%` → `%25`. |
| `EACCES` ou erro de permissão no npm | Não use `sudo npm install`; use um usuário normal e certifique-se de que a pasta do projeto pertence a esse usuário. |

### Erro P3018 – REFERENCES denied

Se a migração falhar com `REFERENCES command denied to user 'X' for table 'agenda_toss.Quadra'`, o usuário MySQL não tem privilégio para criar foreign keys. **Conceda todos os privilégios** no banco (como root no MySQL):

```bash
sudo mysql -u root -p
```

```sql
GRANT ALL PRIVILEGES ON agenda_toss.* TO 'lucas'@'31.97.24.69';
-- ou, se o usuário for de qualquer host:
GRANT ALL PRIVILEGES ON agenda_toss.* TO 'lucas'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Troque `lucas` e `31.97.24.69` pelo usuário e host que aparecem na mensagem de erro. Depois [recupere a migração que falhou](#recuperar-migração-falha-p3018).

### Recuperar migração falha (P3018)

Quando uma migração falha no meio, o Prisma não aplica outras até você resolver. Duas opções:

**Opção 1 – Zerar o banco e rodar de novo** (recomendado se não há dados importantes)

Na VPS, como root no MySQL:

```bash
sudo mysql -u root -p
```

```sql
DROP DATABASE agenda_toss;
CREATE DATABASE agenda_toss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON agenda_toss.* TO 'lucas'@'%';   -- use seu usuário/host
FLUSH PRIVILEGES;
EXIT;
```

No backend:

```bash
npx prisma migrate deploy
```

**Opção 2 – Completar a migração manualmente** (se as tabelas já existem e você não quer apagar)

Conceda os privilégios (comando acima). Depois aplique só as foreign keys que faltaram. No MySQL:

```sql
USE agenda_toss;
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_quadraId_fkey` FOREIGN KEY (`quadraId`) REFERENCES `Quadra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ItemComanda` ADD CONSTRAINT `ItemComanda_comandaId_fkey` FOREIGN KEY (`comandaId`) REFERENCES `Comanda`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ItemComanda` ADD CONSTRAINT `ItemComanda_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MovimentacaoEstoque` ADD CONSTRAINT `MovimentacaoEstoque_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `Produto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

Em seguida, na pasta do backend na VPS, marque a migração como aplicada:

```bash
npx prisma migrate resolve --applied 20250219000000_init
```

---

## Usar MariaDB em vez de MySQL

Se preferir MariaDB (compatível com MySQL para o Prisma):

```bash
sudo apt update
sudo apt install -y mariadb-server
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
```

Depois crie o banco e o usuário do mesmo jeito (com `sudo mysql -u root -p` e os mesmos comandos `CREATE DATABASE`, `CREATE USER`, `GRANT`). A `DATABASE_URL` continua no formato `mysql://...`.

---

Com isso, o banco fica criado **na sua VPS Linux** e a API do Agenda TOSS consegue usá-lo normalmente.
