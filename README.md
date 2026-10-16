# ChessGabon Gestion

Projet **BTS SIO SLAM** — gestion d’un club d’échecs : membres, tournois, import CSV, classements multi-cadences (Bullet · Blitz · Rapide).

Frontend **Next.js 15 + Tailwind CSS v4** · Backend **NestJS + Prisma + PostgreSQL**.

## Documentation

| Fichier | Contenu |
|---------|---------|
| [docs/README.md](docs/README.md) | Vue d’ensemble, démarrage, règlement points |
| [docs/API.md](docs/API.md) | Endpoints REST |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Routes UI, structure, design system |
| [docs/TEST-DATA.md](docs/TEST-DATA.md) | Seed, CSV, tests de cohérence / persistance |

## Installation

### Backend

```bash
cd backend
cp .env.example .env
# DATABASE_URL="postgresql://…"
# JWT_SECRET optionnel (défaut: secret_bts_sio)

npm install
npx prisma generate
npx prisma db push
npx prisma db seed          # admin + 5 membres + 2 tournois
npm run start:dev           # http://localhost:3001
```

**Admin seed :** `admin@chessgabon.ga` / `Admin123!`

### Frontend

```bash
cd frontend
npm install
# optionnel : NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev                 # http://localhost:3000
```

## Fonctionnalités

**Public**

- Classements (général, cadence, mensuel, annuel) + podium
- Liste des tournois · fiche joueur · à propos · 404

**Admin** (JWT)

- CRUD membres (recherche, tri, menu mobile)
- CRUD tournois
- Import CSV Lichess / Chess.com / générique

## Tests rapides

```bash
# Après seed
curl -s http://localhost:3001/rankings | jq '[.[] | {pseudo, points}]'
# Attendu : KingNdong & BlitzQueen à 36 pts (voir docs/TEST-DATA.md)

curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@chessgabon.ga","password":"Admin123!"}'
```

Fixtures CSV : `backend/prisma/fixtures/*.csv`
