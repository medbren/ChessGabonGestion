'use client';

import { useState } from 'react';

export default function TournamentForm() {
  const [message, setMessage] = useState('');

  async function createTournament(event: any) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const form = event.target;

    const data = {
      name: form.name.value,
      platform: form.platform.value,
      timeControl: form.timeControl.value,
      date: form.date.value,
    };

    const res = await fetch('http://localhost:3001/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('Tournoi créé avec succès');
      form.reset();
    } else {
      const error = await res.text();
      setMessage(`Erreur : ${error}`);
    }
  }

  return (
    <section>
      <h2>Créer un tournoi</h2>

      <form onSubmit={createTournament}>
        <p>
          <input
            name="name"
            placeholder="Nom du tournoi"
            required
          />
        </p>

        <p>
          <select name="platform">
            <option value="LICHESS">Lichess</option>
            <option value="CHESSCOM">Chess.com</option>
            <option value="OTHER">Autre</option>
          </select>
        </p>

        <p>
          <select name="timeControl">
            <option value="BULLET">Bullet</option>
            <option value="BLITZ">Blitz</option>
            <option value="RAPID">Rapide</option>
            <option value="CLASSICAL">Classique</option>
          </select>
        </p>

        <p>
          <input
            type="date"
            name="date"
            required
          />
        </p>

        <button type="submit">
          Créer le tournoi
        </button>
      </form>

      <p>{message}</p>
    </section>
  );
}