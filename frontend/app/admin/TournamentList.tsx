'use client';

import { useEffect, useState } from 'react';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [editingTournament, setEditingTournament] = useState<any | null>(null);

  function getToken() {
    return localStorage.getItem('token');
  }

  async function loadTournaments() {
    const token = getToken();

    const res = await fetch('http://localhost:3001/tournaments', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setTournaments(Array.isArray(data) ? data : []);
  }

  async function updateTournament(event: any) {
    event.preventDefault();

    if (!editingTournament) return;

    const token = getToken();
    const form = event.target;

    const data = {
      name: form.name.value,
      platform: form.platform.value,
      timeControl: form.timeControl.value,
      date: form.date.value,
    };

    const res = await fetch(
      `http://localhost:3001/tournaments/${editingTournament.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (res.ok) {
      setMessage('Tournoi modifié avec succès');
      setEditingTournament(null);
      loadTournaments();
    } else {
      setMessage('Erreur lors de la modification du tournoi');
    }
  }

  async function deleteTournament(id: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce tournoi ?');

    if (!confirmed) return;

    const token = getToken();

    const res = await fetch(`http://localhost:3001/tournaments/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setMessage('Tournoi supprimé avec succès');
      loadTournaments();
    } else {
      setMessage('Erreur lors de la suppression du tournoi');
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  return (
    <section>
      <h2>Liste des tournois</h2>

      <p>{message}</p>

      {editingTournament && (
        <>
          <h3>Modifier un tournoi</h3>

          <form onSubmit={updateTournament}>
            <p>
              <input
                name="name"
                defaultValue={editingTournament.name}
                required
              />
            </p>

            <p>
              <select name="platform" defaultValue={editingTournament.platform}>
                <option value="LICHESS">Lichess</option>
                <option value="CHESSCOM">Chess.com</option>
                <option value="OTHER">Autre</option>
              </select>
            </p>

            <p>
              <select name="timeControl" defaultValue={editingTournament.timeControl}>
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
                defaultValue={editingTournament.date.slice(0, 10)}
                required
              />
            </p>

            <button type="submit">Enregistrer</button>{' '}
            <button type="button" onClick={() => setEditingTournament(null)}>
              Annuler
            </button>
          </form>

          <hr />
        </>
      )}

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Plateforme</th>
            <th>Cadence</th>
            <th>Date</th>
            <th>Résultats</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tournaments.map((tournament) => (
            <tr key={tournament.id}>
              <td>{tournament.id}</td>
              <td>{tournament.name}</td>
              <td>{tournament.platform}</td>
              <td>{tournament.timeControl}</td>
              <td>{new Date(tournament.date).toLocaleDateString()}</td>
              <td>{tournament.results?.length ?? 0}</td>
              <td>
                <button onClick={() => setEditingTournament(tournament)}>
                  Modifier
                </button>{' '}
                <button onClick={() => deleteTournament(tournament.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}