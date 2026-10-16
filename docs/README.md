# ChessGabon Gestion — Documentation

Projet **BTS SIO SLAM** : gestion d’un club d’échecs (membres, tournois, résultats, classements multi-cadences).

| Doc | Contenu |
|-----|---------|
| [API.md](./API.md) | Endpoints REST, auth JWT |
| [FRONTEND.md](./FRONTEND.md) | Architecture UI Tailwind, routes |
| [TEST-DATA.md](./TEST-DATA.md) | Jeu de données, seed, cohérence / persistance |

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, TypeScript |
| Backend | NestJS 10, Prisma 6, PostgreSQL |
| Auth | JWT (bcrypt), rôle `ADMIN` |

## Démarrage rapide

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev

cd ../frontend
npm install
npm run dev
```

**Compte admin seed :** `admin@chessgabon.ga` / `Admin123!`

## Règlement points championnat

| Rang | Points | Rang | Points |
|------|--------|------|--------|
| 1er | 20 | 6e | 7 |
| 2e | 16 | 7e | 5 |
| 3e | 13 | 8e | 4 |
| 4e | 11 | 9e | 3 |
| 5e | 9 | 10e | 2 |
| 11e+ | 1 | | |
