# Arquitetura Frontend — Guido Power

Projeto pequeno — Feature-based, sem Clean Architecture, FSD completo ou estado global pesado.

**Stack:** React (Vite) · TypeScript · React Router · Tailwind CSS · Docker Compose

Contrato com o backend: HTTP JSON sob `/api`. Camadas do servidor: [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md).

---

## 1. Visão geral

```text
Page (rota)
    |
Feature hook
    |
Feature api
    |
shared/api (fetch base)
    |
HTTP /api  -->  backend (Express)
```

Fluxo: página compõe UI → hook da feature orquestra loading/erro → funções HTTP tipadas → client compartilhado → Express.

O sistema não tem login: não há token, rota protegida nem tela de autenticação.

---

## 2. Estrutura (`frontend/src/`)

```text
frontend/src/
├── main.tsx                  # monta o React e importa o CSS
├── App.tsx
├── app/                      # router e layout
├── pages/                    # uma pasta por rota
├── features/
│   └── <contexto>/           # api, components, hooks, types
├── shared/
│   └── api/                  # client HTTP base
└── styles/                   # entry CSS Tailwind + tokens
```

`<contexto>` espelha o contexto do backend com o mesmo nome. O esqueleto não traz feature pronta: a home consulta só `/api/health` via `shared/api`.

---

## 3. Camadas

| Camada | Onde | Contém | Não contém |
|--------|------|--------|------------|
| **Page** | `pages/` | Rota e composição de features | Fetch direto, regra de negócio |
| **Feature api** | `features/<contexto>/api/` | Chamadas HTTP tipadas daquele contexto | JSX, estado de tela |
| **Feature hooks** | `features/<contexto>/hooks/` | Loading, erro, orquestra a api | Express, Mongoose |
| **Feature components** | `features/<contexto>/components/` | UI específica do domínio (classes Tailwind) | Persistência |
| **Feature types** | `features/<contexto>/types.ts` | DTOs alinhados à API | Schemas Mongoose / entities do backend |
| **Shared api** | `shared/api/` | `fetch` base, headers, erros HTTP | Regra de um contexto específico |

### Pastas de uma feature

```text
frontend/src/features/<contexto>/
├── api/          # ex.: list(), getById(id), create(data)
├── components/   # cards, formulários, filtros do domínio
├── hooks/        # ex.: use<Contexto>s() — estado, loading, erro
└── types.ts      # formato JSON da API
```

---

## 4. Contrato com a API

- Única fonte de dados no frontend: **HTTP JSON** sob `/api`.
- Em desenvolvimento, o Vite encaminha `/api` para o backend (`vite.config.ts` + `API_PROXY_TARGET`).
- Em produção, o Nginx do container `frontend` encaminha `/api/` para `backend:3000`.
- Erros chegam como `{ "error": "mensagem" }` e viram `ApiError` em `shared/api/client.ts`.
- Validação de formulário no client é só UX; a validação oficial fica no controller Express.
- Regras de negócio ficam no **service** do backend.

---

## 5. Estilos (Tailwind)

- **Stack:** Tailwind CSS v4 + plugin `@tailwindcss/vite` em `vite.config.ts`.
- **Entry:** `src/styles/index.css` com `@import "tailwindcss"`, importado por `main.tsx`.
- **Tokens de marca:** cores e fontes em `@theme` no mesmo CSS — sem `tailwind.config.js`.

| Contém | Não contém |
|--------|------------|
| Utilitários Tailwind nos componentes | CSS-in-JS, CSS Modules como padrão |
| `@theme` para tokens compartilhados | Folhas CSS por feature sem necessidade |

---

## 6. Qualidade

- `npm run lint` (Oxlint) e `npm run build` (`tsc -b` + Vite) dentro de `frontend/`.
- Sem runner de testes de UI por enquanto; testes Jest ficam no backend.

---

## 7. Desenvolvimento local

Use Docker Compose conforme o [README](../README.md):

- Dev: `docker compose -f docker-compose.dev.yml up --build`
- App (Vite): `http://localhost:5174`

---

## 8. Fora de escopo deste projeto

Não usamos Clean Architecture / Hexagonal no front, Feature-Sliced Design completo, Redux/saga, React Query como obrigação, OpenAPI client gerado, CSS-in-JS nem autenticação. Organização é Feature-based + HTTP `/api` + Tailwind.
