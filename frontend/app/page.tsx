'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [title, setTitle] = useState('Classement général');

  async function loadRankings(url: string, newTitle: string) {
    const res = await fetch(url);
    const data = await res.json();

    setRankings(Array.isArray(data) ? data : []);
    setTitle(newTitle);
  }

  function downloadCsv(data: any[], filename: string) {
    const headers = [
      'Rang',
      'Pseudo',
      'Nom',
      'Points championnat',
      'Score brut cumule',
      'Tournois',
    ];

    const rows = data.map((player) => [
      player.rank,
      player.pseudo,
      player.fullName,
      player.points,
      player.rawPoints,
      player.tournaments,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function exportMonthlyCsv() {
    const res = await fetch(
      'http://localhost:3001/rankings?type=monthly&month=6&year=2026'
    );

    const data = await res.json();

    if (Array.isArray(data)) {
      downloadCsv(data, 'classement_mensuel_06_2026.csv');
    }
  }

  async function exportYearlyCsv() {
    const res = await fetch(
      'http://localhost:3001/rankings?type=yearly&year=2026'
    );

    const data = await res.json();

    if (Array.isArray(data)) {
      downloadCsv(data, 'classement_annuel_2026.csv');
    }
  }

  useEffect(() => {
    loadRankings('http://localhost:3001/rankings', 'Classement général');
  }, []);

  return (
    <main style={{ maxWidth: '950px', margin: '40px auto' }}>
      <h1>ChessGabonGestion</h1>

      <p>
        Gestion des tournois, imports CSV Lichess/Chess.com et classements
        annuels.
      </p>

      <p>
        <button onClick={() => loadRankings('http://localhost:3001/rankings', 'Classement général')}>
          Général
        </button>{' '}

        <button onClick={() => loadRankings('http://localhost:3001/rankings?timeControl=BLITZ', 'Classement Blitz')}>
          Blitz
        </button>{' '}

        <button onClick={() => loadRankings('http://localhost:3001/rankings?timeControl=RAPID', 'Classement Rapide')}>
          Rapide
        </button>{' '}

        <button onClick={() => loadRankings('http://localhost:3001/rankings?type=monthly&month=6&year=2026', 'Classement mensuel - Juin 2026')}>
          Mensuel
        </button>{' '}

        <button onClick={() => loadRankings('http://localhost:3001/rankings?type=yearly&year=2026', 'Classement annuel - 2026')}>
          Annuel
        </button>{' '}

        <a href="/login">Administration</a>
      </p>

      <p>
        <button onClick={exportMonthlyCsv}>
          Exporter mensuel CSV
        </button>{' '}

        <button onClick={exportYearlyCsv}>
          Exporter annuel CSV
        </button>
      </p>

      <h2>{title}</h2>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Rang</th>
            <th>Joueur</th>
            <th>Nom</th>
            <th>Points championnat</th>
            <th>Score brut cumulé</th>
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