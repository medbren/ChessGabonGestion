# API REST — ChessGabon Gestion

Base URL : `http://localhost:3001` (ou `NEXT_PUBLIC_API_URL`).

Auth : header `Authorization: Bearer <accessToken>` pour les routes protégées (JWT admin).

---

## Auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/setup` | — | Premier admin uniquement |
| POST | `/auth/login` | — | `{ email, password }` → `{ accessToken, user }` |

---

## Membres

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/members` | public |
| GET | `/members/:id/results` | public |
| POST | `/members` | JWT |
| PATCH | `/members/:id` | JWT |
| DELETE | `/members/:id` | JWT |

Body : `{ firstName, lastName, pseudo, lichess?, chesscom? }`

`GET /members/:id/results` retourne le détail public (totaux + résultats par tournoi).

---

## Tournois

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/tournaments` | public |
| GET | `/tournaments/:id` | public |
| POST | `/tournaments` | JWT |
| PATCH | `/tournaments/:id` | JWT |
| DELETE | `/tournaments/:id` | JWT |
| POST | `/tournaments/:id/results` | JWT |

Body tournoi :

```json
{
  "name": "string",
  "platform": "LICHESS | CHESSCOM | OTHER",
  "timeControl": "BULLET | BLITZ | RAPID | CLASSICAL",
  "date": "YYYY-MM-DD",
  "externalUrl": "https://www.chess.com/tournament/..." // optionnel
}
```

`GET /tournaments/:id` inclut les résultats ordonnés avec `member` (`id`, `pseudo`, `firstName`, `lastName`, `chesscom`, `lichess`).

Body résultat : `{ memberId, points, rank? }` → `championshipPoints` calculés automatiquement.

---

## Classements

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/rankings` | public |
| GET | `/rankings/dashboard` | public (stats admin) |

Query `/rankings` :

| Param | Exemple | Effet |
|-------|---------|--------|
| `timeControl` | `BULLET` | Filtre cadence |
| `type=monthly&month=&year=` | `month=6&year=2026` | Période mensuelle |
| `type=yearly&year=` | `year=2026` | Année |

Chaque entrée :

```json
{
  "rank": 1,
  "id": 12,
  "pseudo": "...",
  "fullName": "...",
  "points": 40,
  "rawPoints": 22.5,
  "tournaments": 3,
  "chesscom": "username" // ou null
}
```

- **points** : somme des points **championnat**
- **rawPoints** : somme des scores de **parties** (Swiss 1/½/0 ou Arena 2/3/4…)
- **chesscom** : pour les avatars côté frontend

Tri serveur : `points` ↓ → `tournaments` ↓ → `rawPoints` ↓ → `pseudo`.

---

## Chess.com

Préfixe `/chesscom`. Club par défaut : env `CHESSCOM_CLUB_URL_ID` (`chess-gabon-1`).

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/chesscom/club` | public | Profil club |
| GET | `/chesscom/tournament-games?url=` | public | Parties (rondes / arène) |
| POST | `/chesscom/sync-members` | JWT | Sync membres club `{ createMissing?: boolean }` |
| POST | `/chesscom/preview-tournament` | JWT | Aperçu standings `{ url }` |
| POST | `/chesscom/import-tournament` | JWT | Import tournoi + résultats `{ url, createMissing? }` |

### URLs tournoi acceptées

- `https://www.chess.com/tournament/live/…-31089681`
- `https://www.chess.com/tournament/live/arena/bullet-31160977`
- Identifiant PubAPI seul : `bullet-31160977`

### Arena vs Swiss

- **Swiss** : score partie 1 / 0,5 / 0
- **Arena** : barème séries Chess.com (2 / 3 / 4 pour les victoires d’affilée)

L’import enregistre `externalUrl` et crée les `Result` (points = score tournoi, `championshipPoints` selon le rang).

---

## Erreurs courantes

| Code | Cause typique |
|------|----------------|
| 401 | Token manquant / expiré → se reconnecter |
| 400 | URL tournoi invalide, body incomplet |
| 404 | Tournoi ou membre introuvable |
| 503 | Chess.com indisponible |
