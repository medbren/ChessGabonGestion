# ChessGabon Gestion — Documentation

Projet **BTS SIO SLAM** : gestion d’un club d’échecs (membres, tournois, résultats, classements multi-cadences) avec intégration **Chess.com**.

| Doc | Contenu |
|-----|---------|
| [API.md](./API.md) | Endpoints REST, auth JWT, Chess.com |
| [FRONTEND.md](./FRONTEND.md) | Routes UI, composants, avatars |
| [TEST-DATA.md](./TEST-DATA.md) | Seed, import Chess.com, checklist |

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, TypeScript |
| Backend | NestJS 10, Prisma 6, PostgreSQL |
| Auth | JWT (bcrypt), rôle `ADMIN` |
| Données externes | Chess.com PubAPI (club, tournois, parties, avatars) |

## Démarrage rapide

```bash
cd backend
cp .env.example .env   # DATABASE_URL, JWT_SECRET, CHESSCOM_CLUB_URL_ID=chess-gabon-1
npm install
npx prisma generate
npx prisma db push
npx prisma db seed     # optionnel (jeu de démo)
npm run start:dev      # http://localhost:3001

cd ../frontend
npm install
# .env.local : NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev            # http://localhost:3000
```

**Compte admin seed :** `admin@chessgabon.ga` / `Admin123!`

## Fonctionnalités principales

- Classements général / bullet / blitz / rapide / mensuel / annuel
- Tri colonnes (rang, points championnat, score brut, tournois)
- Fiches membres publiques avec photo Chess.com
- Tournois : liste, fiche, import CSV, import Chess.com (Swiss + Arena)
- Fiche tournoi : classement, parties live, analyses (ECO, surprises, PGN)
- Admin : membres, tournois, sync club Chess.com, import
- Mode sombre, nav mobile (drawer), responsive

## Règlement points **championnat** (classement club)

Attribués selon le **rang** dans un tournoi importé :

| Rang | Points | Rang | Points |
|------|--------|------|--------|
| 1er | 20 | 6e | 7 |
| 2e | 16 | 7e | 5 |
| 3e | 13 | 8e | 4 |
| 4e | 11 | 9e | 3 |
| 5e | 9 | 10e | 2 |
| 11e+ | 1 | | |

**Ordre de classement :** points championnat → nombre de tournois → score brut (somme des scores de parties) → pseudo.

## Barème **Arena Chess.com** (score dans le tournoi)

Lors de l’import d’une arène, le score de partie suit Chess.com :

| Résultat | Points |
|----------|--------|
| Défaite | 0 |
| Nulle | 1 |
| 1ʳᵉ victoire d’une série | 2 |
| 2ᵉ victoire d’affilée | 3 |
| 3ᵉ+ d’affilée | 4 |

Les **Swiss** restent en 1 / ½ / 0 par partie.

## Variables d’environnement utiles

**Backend**

| Variable | Défaut / rôle |
|----------|----------------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | Secret JWT |
| `CHESSCOM_CLUB_URL_ID` | `chess-gabon-1` |
| `CHESSCOM_USER_AGENT` | UA pour PubAPI |

**Frontend**

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_API_URL` | Base API (ex. `http://localhost:3001`) |
