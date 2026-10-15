# Guido Power

Base do projeto: frontend React, API Express e MongoDB, tudo em containers Docker para o grupo rodar igual em qualquer máquina.

## Tecnologias

- **Frontend:** React (Vite) · TypeScript · React Router · Tailwind CSS
- **Backend:** TypeScript (Node / Express) · Mongoose
- **Banco de dados:** MongoDB
- **Testes:** Jest + Supertest (backend)
- **Containers:** Docker Compose (frontend, backend, MongoDB)

Arquitetura: [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) · [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md).

---

## Como rodar

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto. Não é preciso instalar Node nem Mongo na máquina.

Há dois arquivos Compose. **Não suba os dois ao mesmo tempo** (eles usam os mesmos nomes de container).

| Arquivo | Para que serve | App |
| ------- | -------------- | --- |
| `docker-compose.dev.yml` | Programar: o código recarrega ao salvar | http://localhost:5174 |
| `docker-compose.yml` | Empacotado: build + Nginx, como o sistema sobe "de verdade" | http://localhost:8080 |

### Primeira vez

1. Clone o repositório e entre na pasta:

```bash
git clone https://github.com/EduParize/Guido-Power.git
cd Guido-Power
```

2. Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell): `Copy-Item .env.example .env`

3. Suba no modo **desenvolvimento**:

```bash
docker compose -f docker-compose.dev.yml up --build
```

4. Confira no navegador:

| Serviço | URL |
| ------- | --- |
| App (Vite) | http://localhost:5174 |
| API (health) | http://localhost:3001/api/health |
| MongoDB | localhost:27018 |

Edite os arquivos em `frontend/` e `backend/` normalmente; os containers recarregam sozinhos. O Vite encaminha `/api` para o serviço `backend`. Dentro da rede Docker o Mongo usa o hostname `mongo` (veja `MONGO_URI` no `.env`).

As portas no host são diferentes das do Catalog-AMCG, então os dois projetos podem rodar ao mesmo tempo.

### Comandos do dia a dia

```bash
# subir em segundo plano
docker compose -f docker-compose.dev.yml up -d

# ver logs
docker compose -f docker-compose.dev.yml logs -f backend

# rodar os testes do backend
docker compose -f docker-compose.dev.yml exec backend npm test

# parar
docker compose -f docker-compose.dev.yml down

# parar e apagar os dados do Mongo
docker compose -f docker-compose.dev.yml down -v
```

Depois de adicionar uma dependência no `package.json`, suba de novo com `--build` e `-V` (`up --build -V`) para recriar o volume de `node_modules`.

### Modo produção

```bash
docker compose up --build
```

O frontend é compilado e servido pelo Nginx em http://localhost:8080; o Nginx encaminha `/api` para o backend.
