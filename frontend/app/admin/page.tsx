'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TournamentForm from './TournamentForm';
import ImportCsvForm from './ImportCsvForm';
import TournamentList from './TournamentList';

export default function AdminPage() {
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Recherche dans la liste des membres (bts)
  const [searchTerm, setSearchTerm] = useState('');

  // Tri par colonne (bts)
  const [sortColumn, setSortColumn] = useState('pseudo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  function getToken() {
    return localStorage.getItem('token');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  async function loadMembers() {
    const token = getToken();

    const res = await fetch('http://localhost:3001/members', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
  }

  async function loadMemberResults(id: number) {
    const token = getToken();

    const res = await fetch(`http://localhost:3001/members/${id}/results`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedMember(data);
    }
  }

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setReady(true);
    loadMembers();
  }, []);

  async function addMember(event: any) {
    event.preventDefault();

    const token = getToken();
    const form = event.target;

    const data = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      pseudo: form.pseudo.value,
      lichess: form.lichess.value,
      chesscom: form.chesscom.value,
    };

    const res = await fetch('http://localhost:3001/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('Membre ajouté avec succès');
      form.reset();
      loadMembers();
    } else {
      setMessage("Erreur lors de l'ajout");
    }
  }

  async function updateMember(event: any) {
    event.preventDefault();

    if (!editingMember) return;

    const token = getToken();
    const form = event.target;

    const data = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      pseudo: form.pseudo.value,
      lichess: form.lichess.value,
      chesscom: form.chesscom.value,
    };

    const res = await fetch(`http://localhost:3001/members/${editingMember.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('Membre modifié avec succès');
      setEditingMember(null);
      loadMembers();
    } else {
      setMessage('Erreur lors de la modification');
    }
  }

  async function deleteMember(id: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce membre ?');
    if (!confirmed) return;

    const token = getToken();

    const res = await fetch(`http://localhost:3001/members/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setMessage('Membre supprimé avec succès');
      setSelectedMember(null);
      loadMembers();
    } else {
      setMessage('Erreur lors de la suppression');
    }
  }

  function sortBy(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const filteredAndSortedMembers = members
    .filter((member) => {
      const search = searchTerm.toLowerCase();

      return (
        member.pseudo?.toLowerCase().includes(search) ||
        member.firstName?.toLowerCase().includes(search) ||
        member.lastName?.toLowerCase().includes(search) ||
        member.lichess?.toLowerCase().includes(search) ||
        member.chesscom?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const valueA = String(a[sortColumn] ?? '').toLowerCase();
      const valueB = String(b[sortColumn] ?? '').toLowerCase();

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (!ready) {
    return <p>Vérification de la connexion...</p>;
  }

  return (
    <main style={{ maxWidth: '1100px', margin: '40px auto' }}>
      <h1>Administration ChessGabonGestion</h1>

      <button onClick={logout}>Se déconnecter</button>

      <h2>Ajouter un membre</h2>

      <form onSubmit={addMember}>
        <p><input name="firstName" placeholder="Prénom" required /></p>
        <p><input name="lastName" placeholder="Nom" required /></p>
        <p><input name="pseudo" placeholder="Pseudo" required /></p>
        <p><input name="lichess" placeholder="Pseudo Lichess" /></p>
        <p><input name="chesscom" placeholder="Pseudo Chess.com" /></p>
        <button type="submit">Ajouter le membre</button>
      </form>

      {editingMember && (
        <>
          <hr />
          <h2>Modifier un membre</h2>

          <form onSubmit={updateMember}>
            <p><input name="firstName" defaultValue={editingMember.firstName} required /></p>
            <p><input name="lastName" defaultValue={editingMember.lastName} required /></p>
            <p><input name="pseudo" defaultValue={editingMember.pseudo} required /></p>
            <p><input name="lichess" defaultValue={editingMember.lichess} /></p>
            <p><input name="chesscom" defaultValue={editingMember.chesscom} /></p>

            <button type="submit">Enregistrer</button>{' '}
            <button type="button" onClick={() => setEditingMember(null)}>
              Annuler
            </button>
          </form>
        </>
      )}

      <p>{message}</p>

      <hr />

      <h2>Liste des membres</h2>

      <p>
        <input
          placeholder="Rechercher un joueur..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </p>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th onClick={() => sortBy('id')}>ID</th>
            <th onClick={() => sortBy('pseudo')}>Pseudo</th>
            <th onClick={() => sortBy('firstName')}>Nom</th>
            <th onClick={() => sortBy('lichess')}>Lichess</th>
            <th onClick={() => sortBy('chesscom')}>Chess.com</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredAndSortedMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{member.pseudo}</td>
              <td>{member.firstName} {member.lastName}</td>
              <td>{member.lichess}</td>
              <td>{member.chesscom}</td>
              <td>
                <button onClick={() => loadMemberResults(member.id)}>
                  Fiche
                </button>{' '}
                <button onClick={() => setEditingMember(member)}>
                  Modifier
                </button>{' '}
                <button onClick={() => deleteMember(member.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedMember && (
        <>
          <hr />

          <h2>Fiche joueur : {selectedMember.pseudo}</h2>

          <p>
            Nom : {selectedMember.firstName} {selectedMember.lastName}
          </p>

          <p>
            Lichess : {selectedMember.lichess || '-'} | Chess.com :{' '}
            {selectedMember.chesscom || '-'}
          </p>

          <p>
            Total points : {selectedMember.totalPoints} | Tournois joués :{' '}
            {selectedMember.tournamentsPlayed}
          </p>

          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Tournoi</th>
                <th>Plateforme</th>
                <th>Cadence</th>
                <th>Date</th>
                <th>Rang</th>
                <th>Points</th>
              </tr>
            </thead>

            <tbody>
              {selectedMember.results.map((result: any) => (
                <tr key={result.id}>
                  <td>{result.tournament.name}</td>
                  <td>{result.tournament.platform}</td>
                  <td>{result.tournament.timeControl}</td>
                  <td>{new Date(result.tournament.date).toLocaleDateString()}</td>
                  <td>{result.rank ?? '-'}</td>
                  <td>{result.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <hr />

      <TournamentForm />

      <hr />

      <ImportCsvForm />

      <hr />

      <TournamentList />
    </main>
  );
}