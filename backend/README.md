# Back-end Agenda TOSS

Node.js + Express + Prisma (MySQL). Pronto para rodar na VPS Hostinger com PM2.

## Desenvolvimento local

```bash
cd backend
cp .env.example .env
# Edite .env com sua DATABASE_URL (MySQL local ou Hostinger)
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

- API: `http://localhost:3333`
- Health: `GET /health`
- Banco: `GET /api/db`
- Quadras: `GET /api/quadras`

## Deploy na VPS Hostinger (PM2)

1. **Banco MySQL na Hostinger**  
   Crie o banco no painel e anote: host, usuário, senha e nome do banco. A `DATABASE_URL` deve ser:
   ```txt
   mysql://USUARIO:SENHA@mysql.hostinger.com:3306/NOME_DO_BANCO
   ```
   **Guia detalhado:** [docs/BANCO-VPS.md](docs/BANCO-VPS.md) — passo a passo para criar o banco na VPS e aplicar as tabelas.

2. **Na VPS (SSH)**  
   Instale Node 18.18+ (ou 20 LTS) e PM2 (global):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Subir o projeto via Git (SSH)**  
   No seu PC, crie o repositório (GitHub, GitLab, etc.) e envie o código:
   ```bash
   cd C:\Projetos\Agenda-TOSS
   git init
   git add .
   git commit -m "Back-end inicial"
   git remote add origin https://github.com/SEU_USUARIO/Agenda-TOSS.git
   git push -u origin main
   ```
   Na VPS, clone na pasta onde quer rodar (ex.: `~/agenda-toss`):
   ```bash
   cd ~
   git clone https://github.com/SEU_USUARIO/Agenda-TOSS.git agenda-toss
   cd agenda-toss/backend
   ```
   (Repositório privado: configure SSH na VPS e use `git clone git@github.com:SEU_USUARIO/Agenda-TOSS.git agenda-toss`.)

4. **Configurar e rodar**
   ```bash
   cp .env.example .env
   nano .env   # Cole a DATABASE_URL da Hostinger
   npm install --production
   npx prisma generate
   npx prisma migrate deploy
   mkdir -p logs
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup   # segue as instruções para iniciar com o sistema
   ```

5. **Atualizar depois (novo deploy via Git)**
   Na VPS, na pasta do backend:
   ```bash
   cd ~/agenda-toss
   git pull
   cd backend
   npm install --production
   npx prisma migrate deploy
   pm2 restart agenda-toss-api
   ```

6. **Comandos úteis**
   ```bash
   pm2 status
   pm2 logs agenda-toss-api
   pm2 restart agenda-toss-api
   pm2 stop agenda-toss-api
   ```

7. **Acesso à API de fora da VPS (frontend no PC, mobile, etc.)**  
   O backend escuta na porta 3333. Para o navegador ou outro app fora da VPS conseguir acessar `http://IP_DA_VPS:3333`, é preciso **liberar a porta 3333 no firewall** da VPS. Exemplo com `ufw` (Ubuntu/Debian):
   ```bash
   sudo ufw allow 3333/tcp
   sudo ufw status
   sudo ufw reload
   ```
   No painel da Hostinger (VPS), confira também se não há firewall extra bloqueando a porta 3333.

## Scripts

| Script            | Uso                          |
|-------------------|------------------------------|
| `npm start`       | Produção (node)              |
| `npm run dev`     | Desenvolvimento (watch)       |
| `npm run db:generate` | Gera Prisma Client        |
| `npm run db:push` | Sincroniza schema (dev)      |
| `npm run db:migrate` | Aplica migrações (produção) |
| `npm run db:studio` | Interface Prisma Studio    |
| `npm run db:seed` | Dados iniciais (quadras)     |

## Estrutura

- `prisma/schema.prisma` – modelo do banco (MySQL)
- `prisma/seed.js` – seed de quadras
- `src/server.js` – Express e rotas iniciais
- `src/lib/prisma.js` – cliente Prisma
- `ecosystem.config.cjs` – configuração PM2
