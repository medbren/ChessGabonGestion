'use client';

import { useState } from 'react';

export default function TournamentForm() {
  // Message affiché après la création du tournoi
  // ou en cas d'erreur.
  const [message, setMessage] = useState('');

  // Fonction appelée lors de la soumission du formulaire.
  async function createTournament(event: any) {
    event.preventDefault();

    // Récupération du token JWT stocké après connexion.
    const token = localStorage.getItem('token');

    // Récupération du formulaire HTML.
    const form = event.target;

    // Construction de l'objet tournoi à envoyer au backend.
    const data = {
      name: form.name.value,
      platform: form.platform.value,
      timeControl: form.timeControl.value,
      date: form.date.value,
    };

    // Appel de l'API NestJS pour créer le tournoi.
    const res = await fetch('http://localhost:3001/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

        // Authentification JWT obligatoire.
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Si la création a réussi.
    if (res.ok) {
      setMessage('Tournoi créé avec succès');

      // Réinitialisation du formulaire.
      form.reset();
    } else {
      // Affichage de l'erreur renvoyée par le backend.
      const error = await res.text();
      setMessage(`Erreur : ${error}`);
    }
  }

  return (
    <section>
      <h2>Créer un tournoi</h2>

      {/* Formulaire de création d'un tournoi */}
      <form onSubmit={createTournament}>
        <p>
          <input
            name="name"
            placeholder="Nom du tournoi"
            required
          />
        </p>

        {/* Plateforme d'origine du tournoi */}
        <p>
          <select name="platform">
            <option value="LICHESS">Lichess</option>
            <option value="CHESSCOM">Chess.com</option>
            <option value="OTHER">Autre</option>
          </select>
        </p>

        {/* Cadence du tournoi */}
        <p>
          <select name="timeControl">
            <option value="BULLET">Bullet</option>
            <option value="BLITZ">Blitz</option>
            <option value="RAPID">Rapide</option>
            <option value="CLASSICAL">Classique</option>
          </select>
        </p>

        {/* Date du tournoi */}
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

      {/* Message d'information affiché après l'action */}
      <p>{message}</p>
    </section>
  );
}