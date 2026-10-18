# Données de test — cohérence & persistance

## Fichiers seed / fixtures

| Fichier | Rôle |
|---------|------|
| `backend/prisma/seed.ts` | Seed Prisma |
| `backend/prisma/fixtures/expected-rankings.json` | Totaux attendus (si présent) |
| `backend/prisma/fixtures/*-sample.csv` | CSV import |
| `backend/prisma/fixtures/members-reference.json` | Membres de référence |

## Seed local

```bash
cd backend
npx prisma db push
npx prisma db seed
```

**Admin :** `admin@chessgabon.ga` / `Admin123!`

Le seed historique proposait 5 membres + 2 tournois de démo. En production / club réel, préférer :

1. `POST /chesscom/sync-members` `{ "createMissing": true }`
2. `POST /chesscom/import-tournament` avec les URL des tournois du club

Les données de démo seed peuvent être abandonnées une fois le club synchronisé.

## Import Chess.com — checklist

```bash
# Login admin
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@chessgabon.ga","password":"Admin123!"}' | jq -r .accessToken)

# Aperçu
curl -s -X POST http://localhost:3001/chesscom/preview-tournament \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://www.chess.com/tournament/live/arena/bullet-31160977"}' | jq '.name,.total,.standings[:3]'

# Import
curl -s -X POST http://localhost:3001/chesscom/import-tournament \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://www.chess.com/tournament/live/arena/bullet-31160977","createMissing":true}' | jq

# Parties (public)
curl -s 'http://localhost:3001/chesscom/tournament-games?url=bullet-31160977' | jq '.totalGames,.name'
```

**Arena :** le 1er du standing doit coller au vainqueur Chess.com (barème séries).

**Swiss :** scores en 1 / ½ / 0.

## Classement

```bash
curl -s 'http://localhost:3001/rankings' | jq '[.[] | {rank,pseudo,points,rawPoints,tournaments,chesscom}] | .[:5]'
curl -s 'http://localhost:3001/rankings?timeControl=BULLET' | jq length
```

## Persistance

1. Noter `GET /rankings` et un `GET /tournaments/:id`
2. Redémarrer le backend
3. Comparer : mêmes ids, points, `externalUrl`

## Frontend — smoke test

| Page | Vérifier |
|------|----------|
| `/` | Tri colonnes, avatars, pagination |
| `/membres/:id` | Photo si `chesscom` renseigné |
| `/tournois/:id` | Onglets Parties / Analyses si `externalUrl` |
| `/admin` | Sync membres + import tournoi (JWT) |

## Notes

- Re-importer une arène créée **avant** le fix de barème Arena pour recalculer les scores.
- Token 401 → se reconnecter (`/login`).
- Photos : latence réseau Chess.com normale au premier affichage (puis cache navigateur / module).
