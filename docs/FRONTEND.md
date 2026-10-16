# Frontend — ChessGabon Gestion

Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + TypeScript.

## Routes

| Route | Accès | Description |
|-------|--------|-------------|
| `/` | Public | Classements |
| `/tournois` | Public | Liste tournois |
| `/membres/[id]` | Public | Fiche joueur |
| `/a-propos` | Public | Présentation |
| `/login` | Public | Connexion admin |
| `/admin` | JWT | Membres · Tournois · Import CSV |

## Structure

```
frontend/
├── app/  (pages + globals.css + layout)
├── components/  (Logo, Footer, ui/*)
├── lib/  (api, toast, types, utils)
└── public/
```

## Design system

- Brand `#009E60`, accent `#FCD116`
- Empty states, skeletons, toasts
- Responsive cartes / tables ; safe-area login

## Env

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Import CSV : en-têtes `rank`/`Rank`/`Rk`, `pseudo`/`Username`, `points`/`Points`/`Score`.
