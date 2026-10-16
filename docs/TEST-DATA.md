# Données de test — cohérence & persistance

## Fichiers

| Fichier | Rôle |
|---------|------|
| `backend/prisma/seed.ts` | Seed Prisma |
| `backend/prisma/fixtures/expected-rankings.json` | Totaux attendus |
| `backend/prisma/fixtures/*-sample.csv` | CSV import |
| `backend/prisma/fixtures/members-reference.json` | Membres de référence |

## Seed

```bash
cd backend
npx prisma db push
npx prisma db seed
```

**Admin :** `admin@chessgabon.ga` / `Admin123!`

**5 membres :** KingNdong, BlitzQueen, RapidLion, ChessGabon01, RookMaster

**2 tournois :** Arena Rapid Juin (LICHESS/RAPID) + Blitz Club Soir (CHESSCOM/BLITZ)

### Classement général attendu

| Pseudo | Points | Tournois |
|--------|--------|----------|
| KingNdong | 36 | 2 |
| BlitzQueen | 36 | 2 |
| RapidLion | 24 | 2 |
| RookMaster | 22 | 2 |
| ChessGabon01 | 20 | 2 |

## Checklist

```bash
curl -s http://localhost:3001/members | jq length          # 5
curl -s http://localhost:3001/tournaments | jq length      # 2
curl -s http://localhost:3001/rankings | jq '[.[]|{pseudo,points}]'
```

**Persistance :** noter `/rankings`, redémarrer le backend, comparer.

**Import CSV :** importer les fixtures avec matching des pseudos (pas de doublons).
