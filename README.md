# ChessGabonGestion V2

Projet BTS SIO SLAM : gestion d'un club d'échecs, membres, tournois, résultats et classement.

## Installation backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

API : http://localhost:3001

## Installation frontend

```bash
cd frontend
npm install
npm run dev
```

Site : http://localhost:3000

## Tests rapides API

Créer un membre :
```bash
curl -X POST http://localhost:3001/members -H "Content-Type: application/json" -d '{"firstName":"Mederic","lastName":"NZIE AUDZAGHE","pseudo":"medbren"}'
```

Créer un tournoi :
```bash
curl -X POST http://localhost:3001/tournaments -H "Content-Type: application/json" -d '{"name":"Arena Rapid","platform":"LICHESS","timeControl":"RAPID","date":"2026-06-16"}'
```

Voir le classement :
```bash
curl http://localhost:3001/rankings
```
