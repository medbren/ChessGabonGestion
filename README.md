# ChessGabon Gestion

Projet **BTS SIO SLAM** — gestion d’un club d’échecs : membres, tournois, classements multi-cadences, intégration **Chess.com** (import, parties, avatars).

| Couche | Stack |
|--------|--------|
| Frontend | Next.js 15 · React 19 · Tailwind CSS v4 · TypeScript |
| Backend | NestJS 10 · Prisma 6 · PostgreSQL · JWT |
| Externes | Chess.com PubAPI (club, tournois Swiss/Arena, parties, photos) |

## Documentation détaillée

| Fichier | Contenu |
|---------|---------|
| [docs/README.md](docs/README.md) | Vue d’ensemble, règlement points, variables d’env |
| [docs/API.md](docs/API.md) | Endpoints REST + Chess.com |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Routes UI, avatars, admin |
| [docs/TEST-DATA.md](docs/TEST-DATA.md) | Seed, import, checklist |

## Installation

### Backend

```bash
cd backend
cp .env.example .env
# DATABASE_URL=postgresql://…
# JWT_SECRET=…
# CHESSCOM_CLUB_URL_ID=chess-gabon-1   # optionnel

npm install
npx prisma generate
npx prisma db push
npx prisma db seed          # optionnel : admin + données de démo
npm run start:dev           # http://localhost:3001
```

**Admin seed :** `admin@chessgabon.ga` / `Admin123!`

### Frontend

```bash
cd frontend
npm install
# .env.local : NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev                 # http://localhost:3000
```

## Fonctionnalités

### Public

- **Classements** — général, Bullet / Blitz / Rapide, mensuel, annuel  
  Tri (rang, points, score brut, tournois) · pagination · recherche · podium · avatars Chess.com
- **Tournois** — liste + fiche avec onglets **Classement · Parties · Analyses**
- **Fiche joueur** — résultats, stats, photo Chess.com
- À propos, login, 404 soigné, mode sombre, nav mobile (drawer)

### Admin (JWT)

- CRUD membres & tournois (champ `externalUrl` Chess.com)
- Import **CSV** (Lichess / Chess.com / générique)
- Import **tournoi Chess.com** (Swiss + Arena, barème séries)
- Sync membres du club Chess.com

## Points de classement

| Concept | Signification |
|---------|----------------|
| **Points championnat** | Selon le rang (1er = 20 … 11e+ = 1) |
| **Score brut** | Somme des scores de parties (Swiss 1/½/0 ou Arena 2/3/4…) |

**Arena Chess.com :** victoire 2 pts, 2ᵉ d’affilée 3, 3ᵉ+ 4 ; nulle 1 ; défaite 0.

## Tests rapides

```bash
# Santé API
curl -s http://localhost:3001/rankings | jq 'length'

# Login admin
curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@chessgabon.ga","password":"Admin123!"}'

# Parties d’un tournoi Chess.com (public)
curl -s 'http://localhost:3001/chesscom/tournament-games?url=bullet-31160977' | jq '.totalGames,.name'
```

Voir [docs/TEST-DATA.md](docs/TEST-DATA.md) pour l’import Arena et la checklist complète.

## Structure du dépôt

```
├── backend/          # NestJS + Prisma
├── frontend/         # Next.js App Router
├── docs/             # Documentation projet
└── README.md
```

## Licence / contexte

Projet pédagogique BTS SIO SLAM — club **Chess Gabon** (Libreville).
