# Checklist: atualizar backend na VPS (evitar 404)

Se o frontend continua dando **404** em `/api/produtos` ou `/api/movimentacoes`, a API na VPS está rodando código antigo. Siga estes passos **na VPS (SSH)**.

---

## 1. Onde está o projeto na VPS?

Descubra o caminho onde o backend está (ex.: `/var/www/AgendaToss` ou `~/agenda-toss`). Depois:

```bash
cd /var/www/AgendaToss
# ou: cd ~/agenda-toss
```

---

## 2. O repositório é o mesmo do GitHub?

Se na VPS você clonou **só a pasta backend** (repo separado), o `git pull` deve ser feito **dentro da pasta backend** e o remote deve apontar para o repo que você deu push.

Se você clonou o **projeto inteiro** (com pasta `backend` dentro), faça:

```bash
cd /var/www/AgendaToss   # raiz do projeto
git pull origin main
```

(Substitua `main` pela sua branch.)

---

## 3. Verificar se o arquivo foi atualizado

Confira se a rota de produtos existe no arquivo:

```bash
grep -n "api/produtos" backend/src/server.js
```

Deve aparecer algo como:
`133:app.get('/api/produtos', ...`

Se **não aparecer nada**, o `git pull` não trouxe o código novo. Possíveis causas:
- Branch errada: `git branch` e `git pull origin NOME_DA_BRANCH`
- Conflitos: `git status` e resolver antes de rodar de novo
- Repo diferente na VPS: confira `git remote -v`

---

## 4. Reiniciar o PM2 a partir da pasta do backend

O PM2 precisa ser iniciado **na pasta onde está o `ecosystem.config.cjs`** (a pasta `backend`):

```bash
cd /var/www/AgendaToss/backend
# ou: cd ~/agenda-toss/backend
pm2 restart agenda-toss-api
pm2 save
```

Se der erro "process not found":

```bash
pm2 list
```

Use o **nome** que aparecer na lista (ex.: `agenda-toss-api` ou `backend`).

---

## 5. Testar na própria VPS

Dentro da VPS:

```bash
curl -s http://127.0.0.1:3333/api/produtos
```

Resposta esperada: `[]` (array vazio) e **status 200**, não 404.

Se der 404 ainda, o processo que está rodando na porta 3333 **não é** o que você reiniciou. Verifique:

```bash
pm2 list
pm2 show agenda-toss-api
```

Em "script path" deve estar o `server.js` da pasta **backend** que você atualizou.

---

## 6. Se na VPS o projeto é só a pasta backend

Se você clonou um repositório que **já é** só o backend (sem pasta `backend/` em cima):

```bash
cd /caminho/do/backend   # ex: /var/www/AgendaToss-backend
git pull origin main
npm install --production
pm2 restart agenda-toss-api
pm2 save
```

Nesse caso, o `server.js` está em `src/server.js` dentro desse mesmo diretório.

---

## Resumo rápido

```bash
cd /var/www/AgendaToss
git pull origin main
grep "api/produtos" backend/src/server.js   # deve encontrar
cd backend
pm2 restart agenda-toss-api
pm2 save
curl -s http://127.0.0.1:3333/api/produtos  # deve retornar []
```

Depois disso, teste de novo no navegador: `http://31.97.24.69:3333/api/produtos`.
