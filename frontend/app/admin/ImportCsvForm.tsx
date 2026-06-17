'use client';

import { useState } from 'react';

type CsvRow = {
  rank: number;
  pseudo: string;
  points: number;
};

export default function ImportCsvForm() {
  const [message, setMessage] = useState('');

  function getToken() {
    return localStorage.getItem('token');
  }

  function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split('\n').filter(Boolean);

    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou invalide');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

    const rankIndex =
      headers.indexOf('rank') !== -1
        ? headers.indexOf('rank')
        : headers.indexOf('Rank') !== -1
        ? headers.indexOf('Rank')
        : headers.indexOf('Rk');

    const pseudoIndex =
      headers.indexOf('pseudo') !== -1
        ? headers.indexOf('pseudo')
        : headers.indexOf('Username');

    const pointsIndex =
      headers.indexOf('points') !== -1
        ? headers.indexOf('points')
        : headers.indexOf('Points') !== -1
        ? headers.indexOf('Points')
        : headers.indexOf('Score');

    if (rankIndex === -1 || pseudoIndex === -1 || pointsIndex === -1) {
      throw new Error('Format CSV non reconnu');
    }

    return lines.slice(1).map((line) => {
      const columns = line.split(',').map((c) => c.trim().replace(/"/g, ''));

      return {
        rank: Number(columns[rankIndex]),
        pseudo: columns[pseudoIndex],
        points: Number(columns[pointsIndex]),
      };
    });
  }

  function findExistingMember(members: any[], platform: string, pseudo: string) {
    const normalizedPseudo = pseudo.toLowerCase();

    return members.find((member: any) => {
      const internalPseudo = member.pseudo?.toLowerCase();
      const lichessPseudo = member.lichess?.toLowerCase();
      const chesscomPseudo = member.chesscom?.toLowerCase();

      if (platform === 'LICHESS') {
        return lichessPseudo === normalizedPseudo || internalPseudo === normalizedPseudo;
      }

      if (platform === 'CHESSCOM') {
        return chesscomPseudo === normalizedPseudo || internalPseudo === normalizedPseudo;
      }

      return internalPseudo === normalizedPseudo;
    });
  }

  async function importCsv(event: any) {
    event.preventDefault();

    const token = getToken();
    const form = event.target;
    const file = form.csv.files[0];

    if (!file) {
      setMessage('Aucun fichier sélectionné');
      return;
    }

    try {
      const platform = form.platform.value;

      const tournamentRes = await fetch('http://localhost:3001/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.value,
          platform,
          timeControl: form.timeControl.value,
          date: form.date.value,
        }),
      });

      if (!tournamentRes.ok) {
        setMessage('Erreur lors de la création du tournoi');
        return;
      }

      const tournament = await tournamentRes.json();

      const text = await file.text();
      const rows = parseCsv(text);

      const membersRes = await fetch('http://localhost:3001/members', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!membersRes.ok) {
        setMessage('Erreur lors du chargement des membres');
        return;
      }

      let members = await membersRes.json();

      for (const row of rows) {
        let member = findExistingMember(members, platform, row.pseudo);

        if (!member) {
          const createMemberRes = await fetch('http://localhost:3001/members', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              firstName: row.pseudo,
              lastName: '',
              pseudo: row.pseudo,
              lichess: platform === 'LICHESS' ? row.pseudo : '',
              chesscom: platform === 'CHESSCOM' ? row.pseudo : '',
            }),
          });

          if (!createMemberRes.ok) {
            setMessage(`Erreur lors de la création du membre ${row.pseudo}`);
            return;
          }

          member = await createMemberRes.json();
          members.push(member);
        }

        const resultRes = await fetch(
          `http://localhost:3001/tournaments/${tournament.id}/results`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberId: member.id,
              points: row.points,
              rank: row.rank,
            }),
          }
        );

        if (!resultRes.ok) {
          setMessage(`Erreur lors de l'ajout du résultat pour ${row.pseudo}`);
          return;
        }
      }

      setMessage(`Import terminé avec succès : ${rows.length} résultats importés`);
      form.reset();
    } catch (error: any) {
      setMessage(error.message || 'Erreur pendant l’import');
    }
  }

  return (
    <section>
      <h2>Importer les résultats CSV</h2>

      <p>Formats reconnus :</p>

      <pre>
{`Générique : rank,pseudo,points
Lichess   : Rank,Username,Points
Chess.com : Rk,Username,Score`}
      </pre>

      <form onSubmit={importCsv}>
        <p><input name="name" placeholder="Nom du tournoi" required /></p>

        <p>
          <select name="platform">
            <option value="LICHESS">Lichess</option>
            <option value="CHESSCOM">Chess.com</option>
            <option value="OTHER">Autre / CSV générique</option>
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

        <p><input type="date" name="date" required /></p>

        <p><input type="file" name="csv" accept=".csv" required /></p>

        <button type="submit">Importer le fichier</button>
      </form>

      <p>{message}</p>
    </section>
  );
}