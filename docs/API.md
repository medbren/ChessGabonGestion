# API REST — ChessGabon Gestion

Base URL : `http://localhost:3001`.

Auth : `Authorization: Bearer <accessToken>` pour les routes protégées.

## Auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/setup` | — | Premier admin uniquement |
| POST | `/auth/login` | — | `{ email, password }` → `{ accessToken, user }` |

## Membres

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/members` | public |
| GET | `/members/:id/results` | public |
| POST | `/members` | JWT |
| PATCH | `/members/:id` | JWT |
| DELETE | `/members/:id` | JWT |

Body : `{ firstName, lastName, pseudo, lichess?, chesscom? }`

## Tournois

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/tournaments` | **public** |
| POST | `/tournaments` | JWT |
| PATCH | `/tournaments/:id` | JWT |
| DELETE | `/tournaments/:id` | JWT |
| POST | `/tournaments/:id/results` | JWT |

Body tournoi : `{ name, platform, timeControl, date }`  
`platform` : LICHESS | CHESSCOM | OTHER  
`timeControl` : BULLET | BLITZ | RAPID | CLASSICAL  

Body résultat : `{ memberId, points, rank? }` → `championshipPoints` auto.

## Classements

| Méthode | Route |
|---------|-------|
| GET | `/rankings` |
| GET | `/rankings/dashboard` |

Query : `timeControl`, `type=monthly&month=&year=`, `type=yearly&year=`.
