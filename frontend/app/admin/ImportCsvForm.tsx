'use client';

import { useState } from 'react';

// Représente une ligne lue depuis un fichier CSV.
// Chaque ligne contient le rang, le pseudo et le score du joueur.
type CsvRow = {
  rank: number;
  pseudo: string;
  points: number;
};

export default function ImportCsvForm() {
  // Message affiché à l'utilisateur après un import ou une erreur.
  const [message, setMessage] = useState('');

  // Récupère le token JWT stocké dans le navigateur après connexion admin.
  // Ce token est nécessaire pour appeler les routes protégées du backend.
  function getToken() {
    return localStorage.getItem('token');
  }

  // Analyse le contenu du fichier CSV.
  // Cette fonction reconnaît plusieurs formats :
  // - CSV générique : rank,pseudo,points
  // - Lichess : Rank,Username,Points
  // - Chess.com : Rk,Username,Score
  function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split('\n').filter(Boolean);

    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou invalide');
    }

    // Lecture de la première ligne du fichier CSV : les en-têtes.
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

    // Recherche de la colonne du rang selon le format du fichier.
    const rankIndex =
      headers.indexOf('rank') !== -1
        ? headers.indexOf('rank')
        : headers.indexOf('Rank') !== -1
        ? headers.indexOf('Rank')
        : headers.indexOf('Rk');

    // Recherche de la colonne du pseudo.
    const pseudoIndex =
      headers.indexOf('pseudo') !== -1
        ? headers.indexOf('pseudo')
        : headers.indexOf('Username');

    // Recherche de la colonne du score.
    const pointsIndex =
      headers.indexOf('points') !== -1
        ? headers.indexOf('points')
        : headers.indexOf('Points') !== -1
        ? headers.indexOf('Points')
        : headers.indexOf('Score');

    // Si une colonne obligatoire est absente, on arrête l'import.
    if (rankIndex === -1 || pseudoIndex === -1 || pointsIndex === -1) {
      throw new Error('Format CSV non reconnu');
    }

    // Transformation de chaque ligne CSV en objet TypeScript.
    return lines.slice(1).map((line) => {
      const columns = line.split(',').map((c) => c.trim().replace(/"/g, ''));

      return {
        rank: Number(columns[rankIndex]),
        pseudo: columns[pseudoIndex],
        points: Number(columns[pointsIndex]),
      };
    });
  }

  // Recherche si un joueur existe déjà dans la base.
  // Cela évite les doublons lors de l'import.
  function findExistingMember(members: any[], platform: string, pseudo: string) {
    const normalizedPseudo = pseudo.toLowerCase();

    return members.find((member: any) => {
      const internalPseudo = member.pseudo?.toLowerCase();
      const lichessPseudo = member.lichess?.toLowerCase();
      const chesscomPseudo = member.chesscom?.toLowerCase();

      // Si le tournoi vient de Lichess,
      // on compare avec le pseudo Lichess et le pseudo interne.
      if (platform === 'LICHESS') {
        return lichessPseudo === normalizedPseudo || internalPseudo === normalizedPseudo;
      }

      // Si le tournoi vient de Chess.com,
      // on compare avec le pseudo Chess.com et le pseudo interne.
      if (platform === 'CHESSCOM') {
        return chesscomPseudo === normalizedPseudo || internalPseudo === normalizedPseudo;
      }

      // Pour un CSV générique, on compare seulement avec le pseudo interne.
      return internalPseudo === normalizedPseudo;
    });
  }

  // Fonction principale appelée lors de l'import du fichier.
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

      // 1. Création du tournoi dans la base de données.
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

      // 2. Lecture du fichier CSV dans le navigateur.
      const text = await file.text();

      // 3. Transformation du CSV en lignes exploitables.
      const rows = parseCsv(text);

      // 4. Chargement des membres déjà existants.
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

      // 5. Pour chaque ligne du CSV :
      // - chercher le membre
      // - le créer s'il n'existe pas
      // - enregistrer son résultat
      for (const row of rows) {
        let member = findExistingMember(members, platform, row.pseudo);

        // Si le joueur n'existe pas encore, on le crée automatiquement.
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

          // On ajoute le nouveau membre à la liste locale
          // pour éviter de le recréer si son pseudo apparaît encore.
          members.push(member);
        }

        // 6. Enregistrement du résultat du joueur dans le tournoi.
        // Le backend calcule ensuite automatiquement les points championnat
        // à partir du rang.
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