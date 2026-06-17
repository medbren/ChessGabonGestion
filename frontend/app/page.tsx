'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  // Liste des joueurs du classement actuellement affiché.
  const [rankings, setRankings] = useState<any[]>([]);

  // Titre du classement affiché.
  const [title, setTitle] = useState('Classement général');

  // =====================================================
  // CHARGEMENT D'UN CLASSEMENT
  // =====================================================
  //
  // Cette fonction appelle l'API backend et récupère
  // les données du classement demandé.
  //
  // Exemple :
  // - Général
  // - Blitz
  // - Rapide
  // - Mensuel
  // - Annuel
  async function loadRankings(
    url: string,
    newTitle: string,
  ) {
    const res = await fetch(url);

    const data = await res.json();

    setRankings(
      Array.isArray(data) ? data : [],
    );

    setTitle(newTitle);
  }

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================
  //
  // Lors de l'ouverture de la page,
  // le classement général est chargé automatiquement.
  useEffect(() => {
    loadRankings(
      'http://localhost:3001/rankings',
      'Classement général',
    );
  }, []);

  return (
    <main
      style={{
        maxWidth: '950px',
        margin: '40px auto',
      }}
    >
      <h1>ChessGabonGestion</h1>

      <p>
        Gestion des tournois,
        imports CSV Lichess/Chess.com
        et classements annuels.
      </p>

      {/* =======================================
          BOUTONS DE FILTRE
      ======================================= */}

      <p>
        {/* Classement général */}
        <button
          onClick={() =>
            loadRankings(
              'http://localhost:3001/rankings',
              'Classement général',
            )
          }
        >
          Général
        </button>{' '}

        {/* Classement Blitz */}
        <button
          onClick={() =>
            loadRankings(
              'http://localhost:3001/rankings?timeControl=BLITZ',
              'Classement Blitz',
            )
          }
        >
          Blitz
        </button>{' '}

        {/* Classement Rapide */}
        <button
          onClick={() =>
            loadRankings(
              'http://localhost:3001/rankings?timeControl=RAPID',
              'Classement Rapide',
            )
          }
        >
          Rapide
        </button>{' '}

        {/* Classement du mois */}
        <button
          onClick={() =>
            loadRankings(
              'http://localhost:3001/rankings?type=monthly&month=6&year=2026',
              'Classement mensuel - Juin 2026',
            )
          }
        >
          Mensuel
        </button>{' '}

        {/* Classement annuel */}
        <button
          onClick={() =>
            loadRankings(
              'http://localhost:3001/rankings?type=yearly&year=2026',
              'Classement annuel - 2026',
            )
          }
        >
          Annuel
        </button>{' '}

        {/* Accès à l'administration */}
        <a href="/login">
          Administration
        </a>
      </p>

      {/* Titre du classement affiché */}
      <h2>{title}</h2>

      {/* =======================================
          TABLEAU DES CLASSEMENTS
      ======================================= */}

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Rang</th>
            <th>Joueur</th>
            <th>Nom</th>

            {/* Points utilisés pour le championnat */}
            <th>Points championnat</th>

            {/* Somme des scores réels obtenus
                dans les tournois */}
            <th>Score brut cumulé</th>

            {/* Nombre de tournois joués */}
            <th>Tournois</th>
          </tr>
        </thead>

        <tbody>
          {rankings.map((player) => (
            <tr key={player.id}>
              <td>{player.rank}</td>

              <td>{player.pseudo}</td>

              <td>{player.fullName}</td>

              <td>{player.points}</td>

              <td>{player.rawPoints}</td>

              <td>{player.tournaments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}