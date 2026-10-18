# Frontend — ChessGabon Gestion

Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + TypeScript.

## Routes

| Route | Accès | Description |
|-------|--------|-------------|
| `/` | Public | Classements (filtres, tri, pagination, avatars) |
| `/tournois` | Public | Liste des tournois (+ lien Chess.com) |
| `/tournois/[id]` | Public | Fiche : Classement · Parties · Analyses |
| `/membres/[id]` | Public | Fiche joueur + photo Chess.com |
| `/a-propos` | Public | Présentation / club |
| `/login` | Public | Connexion admin (JWT en localStorage) |
| `/admin` | JWT | Membres · Tournois · Import (CSV / Chess.com) |

## Structure

```
frontend/
├── app/                 # pages + layout + globals
├── components/
│   ├── SiteHeader.tsx   # nav + drawer mobile
│   ├── Footer.tsx
│   ├── TournamentAnalysis.tsx
│   └── ui/
│       ├── Avatar.tsx           # initiales ou image
│       ├── ChessComAvatar.tsx   # photo PubAPI + cache
│       ├── EmptyState.tsx
│       ├── Skeleton.tsx
│       └── …
├── lib/
│   ├── api.ts           # BASE_URL, apiFetch + token
│   ├── types.ts
│   ├── toast.ts
│   └── utils.ts
└── public/
```

## Classement (`/`)

- Filtres : Général, Bullet, Blitz, Rapide, Mensuel, Annuel
- Recherche, « Avec points », pagination
- **Tri** : Rang · Points · Score brut · Tournois (en-têtes cliquables + puces mobile)
- Podium top 3, sticky header table, surlignage 1–2–3
- Avatars via `Player.chesscom` → `ChessComAvatar`

## Fiche tournoi

1. **Classement** — résultats importés + avatars membres  
2. **Parties** — fetch live `GET /chesscom/tournament-games` (layout face-à-face)  
3. **Analyses** — stats, ECO, surprises Elo, PGN  

Nécessite `externalUrl` (ou collage manuel du lien Chess.com).

## Avatars Chess.com

- Client : `https://api.chess.com/pub/player/{username}` (CORS `*`, cache module)
- Fallback : initiales si pas de `chesscom` / erreur réseau
- Utilisé sur : classement, membres, tournoi (classement / parties / analyses)

## Design system

- Brand `#009E60`, accent `#FCD116`, theme-color mobile
- Mode sombre (localStorage)
- Empty states, skeletons, toasts
- Nav burger mobile, safe-area login
- `allowedDevOrigins` dans `next.config.js` pour accès LAN en dev

## Env

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Auth persistante : token JWT stocké côté client et renvoyé par `apiFetch`.

## Admin — imports

- **CSV** : colonnes `rank` / `pseudo` / `points` (variantes d’en-têtes acceptées)
- **Chess.com** : coller l’URL du tournoi (Swiss ou Arena), option créer les membres manquants
- **Sync membres** : lier / créer depuis le club `CHESSCOM_CLUB_URL_ID`
