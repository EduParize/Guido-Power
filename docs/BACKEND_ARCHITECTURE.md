# Arquitetura Backend — Guido Power

Projeto pequeno — camadas claras, sem autenticação, CQRS, workers ou OpenAPI.

**Stack:** Express (TypeScript) · MongoDB (Mongoose) · Docker Compose · Jest

---

## 1. Visão geral

```text
frontend (React/Vite)  --HTTP /api-->  backend (Express)
                                            |
                     application/controllers
                                            |
                              domain/services
                                            |
                    domain/repository (contratos)
                                            |
              infraestructure/repository (Mongo)
                                            |
                                         MongoDB
```

Fluxo: request HTTP → controller → service → contrato de repository → implementação Mongoose → MongoDB.

O sistema não tem login: todas as rotas são públicas.

---

## 2. Layout do monorepo

```text
Guido-Power/
├── frontend/                 React + Vite
├── backend/                  Express + TypeScript
├── docs/                     Documentação (este arquivo)
├── docker-compose.yml
└── docker-compose.dev.yml
```

### Backend (`backend/src/`)

```text
backend/src/
├── app.ts                    # monta o Express e as rotas
├── application/
│   ├── controllers/          # um arquivo por contexto
│   ├── mappers/              # request/response HTTP ↔ domínio
│   ├── middleware/           # error-handler
│   └── validation/           # validações HTTP agnósticas de banco
├── configuration/
│   ├── dotenv.ts
│   ├── env-constants/        # leitura e checagem do .env
│   └── factory/              # liga service ↔ repository
├── domain/
│   ├── common/errors/        # AppError, ValidationError, NotFoundError, ConflictError, NotificationError
│   ├── server/               # bootstrap (server.ts)
│   └── <contexto>/
├── infraestructure/
│   ├── db/mongo/
│   │   ├── connection.ts
│   │   ├── schema/
│   │   └── models/
│   ├── repository/
│   │   └── <contexto>/
│   └── external-service/     # HTTP de terceiros (ex.: Zenvia)
└── tests/
    ├── mocks/
    ├── unit/
    └── integration/
```

`<contexto>` é cada domínio de negócio (ex.: `equipamento`, `consumo`). O esqueleto não traz contexto pronto; o primeiro que entrar segue o molde da seção 3.

A pasta de persistência usa a grafia `infraestructure`.

---

## 3. Camadas

| Camada | Onde | Contém | Não contém |
|--------|------|--------|------------|
| **Controller** | `application/controllers/` | Rotas Express, validação de body/query, chama o service, monta response HTTP | Regra de negócio, Mongoose |
| **Service** | `domain/<contexto>/service/` | Regras de negócio; orquestra entity + repository | `req`/`res`, schemas Mongoose |
| **Repository (contrato)** | `domain/<contexto>/repository/` | Interfaces read/write de persistência | Implementação Mongo |
| **Repository (impl)** | `infraestructure/repository/<contexto>/` | Mongoose + adapters entity ↔ documento | Regras de negócio |
| **Schema / Model** | `infraestructure/db/mongo/` | Schemas e models Mongoose | Lógica de domínio |
| **Entity** | `domain/<contexto>/entity/` | Tipos e constantes do domínio | HTTP ou DB |

### Pastas de um contexto

```text
backend/src/domain/<contexto>/
├── entity/
│   └── <contexto>.entity.ts
├── service/
│   └── <contexto>.service.ts
└── repository/
    ├── <contexto>.repository.read.ts    # findById, list, ...
    └── <contexto>.repository.write.ts   # create, update, delete

backend/src/infraestructure/repository/<contexto>/
├── <contexto>.repository.read.ts
├── <contexto>.repository.write.ts
└── adapters/<contexto>.adapter.ts      # document ↔ entity
```

O controller fica em `application/controllers/<contexto>.controller.ts` e a factory em `configuration/factory/<contexto>.factory.ts`. O controller é montado em `app.ts` sob `/api/<contexto-no-plural>`.

Chamada a serviço de terceiro segue o mesmo corte do repositório: o service depende de um contrato no domain e a factory liga a implementação em `infraestructure/external-service/`. Controller e service não fazem `fetch` nem leem token.

Entidade que só existe dentro de outra vira subdocumento, sem collection própria. É o caso de `Evento` (histórico de status), guardado em `OrdemServico.historico`. A rota dele é aninhada (`/api/ordens-servico/:ordemServicoId/eventos`, com `Router({ mergeParams: true })`), as regras ficam no `OrdemServicoService` e a persistência usa os repositories da ordem com operações atômicas (`$push`, `$set` com `arrayFilters`, `$pull`). `OrdemServico.status` reflete o último evento do histórico.

As mutações do histórico usam `historicoVersao` como compare-and-set. Toda alteração incrementa essa versão; uma escrita baseada em uma leitura ultrapassada retorna conflito HTTP `409`. O histórico nunca fica vazio e não aceita status consecutivos iguais.

Cada evento registra o estado da notificação (`NAO_APLICAVEL`, `PENDENTE`, `ENVIADA` ou `FALHA`). Falha de envio não remove o evento: a API responde `502` com o `eventoId`, e `POST /api/ordens-servico/:ordemServicoId/eventos/:eventoId/notificacao` permite reenvio manual. `ENVIADA` significa que a Zenvia aceitou a requisição com HTTP 2xx, não que o destinatário recebeu a mensagem. Após timeout, o resultado é incerto e o reenvio pode duplicar a mensagem externa, pois o endpoint usado não documenta chave de idempotência.

---

## 4. Validação e erros

- O controller valida body e query antes de chamar o service. Campo ausente ou inválido gera `ValidationError` (HTTP `400`). Ids de rota usam o validador em `application/validation/`, sem importar Mongoose.
- O service lança `NotFoundError` (`404`), `ConflictError` (`409`) ou `AppError` com o status adequado.
- `application/middleware/error-handler.middleware.ts` converte `AppError` em `{ "error": "mensagem" }` e inclui `details` quando existirem (ex.: falha de WhatsApp vira `502` com `eventoId` e `resultadoEnvio`). Qualquer outro erro vira `500`.
- O `.env` é conferido em `configuration/env-constants/env.ts` na subida do servidor: sem `MONGO_URI` válido, ou sem as chaves da Zenvia, a API não inicia.

---

## 5. Persistência

- **MongoDB** é a única fonte de dados.
- **Mongoose** fica só em `infraestructure` (schemas, models, repositories).
- Conexão via `MONGO_URI` (ver `.env.example` e Docker Compose). Dentro da rede Docker o host é `mongo`.
- Valores monetários ficam em centavos inteiros no domínio e no Mongo. A camada `application` converte requests em reais para centavos e responses em centavos para reais; repositories não fazem conversão monetária.

---

## 6. Testes (Jest)

Framework: **Jest** com `ts-jest`; HTTP com **Supertest**.

```text
backend/src/tests/
├── mocks/           # doubles compartilhados (ex.: fake repositories)
├── unit/            # services com mock de repository
└── integration/     # controllers via Supertest
```

| Tipo | Foco |
|------|------|
| Unitário | Service (prioridade) — regras com repository mockado |
| Integração | Controller (HTTP via Supertest) e repository Mongo isolado (`mongodb-memory-server`) |

Rodar: `npm test` dentro de `backend/`, ou `docker compose -f docker-compose.dev.yml exec backend npm test`.

---

## 7. Frontend

- React + Vite + Tailwind em `frontend/`.
- Arquitetura Feature-based (pages → features → shared); detalhes em [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md).
- Contrato com a API: HTTP JSON sob `/api`.

---

## 8. Desenvolvimento local

Use Docker Compose conforme o [README](../README.md):

- Dev: `docker compose -f docker-compose.dev.yml up --build`
- Health: `http://localhost:3001/api/health`

---

## 9. Fora de escopo deste projeto

Não usamos autenticação (JWT, bcrypt, sessões), biblioteca de schema (Zod, Joi), CQRS/MediatR, workers, Kafka, OpenAPI nem PostgreSQL. Persistência é MongoDB; organização é controller → service → repository, e HTTP de terceiro fica em external service.
