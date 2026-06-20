'use client';

import { useState, useRef } from 'react';

/* ─── Constants ──────────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const GREEN = '#009E60';

/* ─── Types ──────────────────────────────────────────────────── */

type CsvRow = {
  rank: number;
  pseudo: string;
  points: number;
};

interface Member {
  id: number;
  pseudo: string;
  lichess?: string;
  chesscom?: string;
}

interface Tournament {
  id: number;
}

type Platform = 'LICHESS' | 'CHESSCOM' | 'OTHER';
type TimeControl = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

/* ─── CSV parser ─────────────────────────────────────────────── */

function findIndex(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.indexOf(c);
    if (i !== -1) return i;
  }
  return -1;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('Fichier CSV vide ou invalide.');

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

  const rankIndex   = findIndex(headers, 'rank', 'Rank', 'Rk');
  const pseudoIndex = findIndex(headers, 'pseudo', 'Username');
  const pointsIndex = findIndex(headers, 'points', 'Points', 'Score');

  if (rankIndex === -1 || pseudoIndex === -1 || pointsIndex === -1) {
    throw new Error('Format CSV non reconnu. Vérifiez les en-têtes.');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    return {
      rank:   Number(cols[rankIndex]),
      pseudo: cols[pseudoIndex],
      points: Number(cols[pointsIndex]),
    };
  });
}

function findExistingMember(
  members: Member[],
  platform: Platform,
  pseudo: string
): Member | undefined {
  const p = pseudo.toLowerCase();
  return members.find((m) => {
    const internal = m.pseudo?.toLowerCase();
    const lichess  = m.lichess?.toLowerCase();
    const chesscom = m.chesscom?.toLowerCase();
    if (platform === 'LICHESS')  return lichess  === p || internal === p;
    if (platform === 'CHESSCOM') return chesscom === p || internal === p;
    return internal === p;
  });
}

/* ─── Component ─────────────────────────────────────────────── */

export default function ImportCsvForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [message,      setMessage]      = useState('');
  const [progress,     setProgress]     = useState<{ done: number; total: number } | null>(null);
  const [fileName,     setFileName]     = useState('');

  function getToken(): string | null {
    return localStorage.getItem('token');
  }

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: `Bearer ${getToken()}`, ...extra };
  }

  function notify(msg: string, status: ImportStatus) {
    setMessage(msg);
    setImportStatus(status);
  }

  async function importCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('csv') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) { notify('Aucun fichier sélectionné.', 'error'); return; }

    setImportStatus('loading');
    setMessage('');
    setProgress(null);

    try {
      const platform    = (form.elements.namedItem('platform')    as HTMLSelectElement).value as Platform;
      const timeControl = (form.elements.namedItem('timeControl') as HTMLSelectElement).value as TimeControl;
      const name        = (form.elements.namedItem('name')        as HTMLInputElement).value;
      const date        = (form.elements.namedItem('date')        as HTMLInputElement).value;

      /* 1 — Create tournament */
      const tournamentRes = await fetch(`${BASE_URL}/tournaments`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, platform, timeControl, date }),
      });
      if (!tournamentRes.ok) { notify('Erreur lors de la création du tournoi.', 'error'); return; }
      const tournament = (await tournamentRes.json()) as Tournament;

      /* 2 — Parse CSV */
      const text = await file.text();
      const rows = parseCsv(text);

      /* 3 — Load existing members */
      const membersRes = await fetch(`${BASE_URL}/members`, {
        headers: authHeaders(),
      });
      if (!membersRes.ok) { notify('Erreur lors du chargement des membres.', 'error'); return; }
      const members: Member[] = await membersRes.json();

      /* 4 — Process each row */
      setProgress({ done: 0, total: rows.length });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let member = findExistingMember(members, platform, row.pseudo);

        if (!member) {
          const createRes = await fetch(`${BASE_URL}/members`, {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              firstName: row.pseudo,
              lastName:  '',
              pseudo:    row.pseudo,
              lichess:   platform === 'LICHESS'  ? row.pseudo : '',
              chesscom:  platform === 'CHESSCOM' ? row.pseudo : '',
            }),
          });
          if (!createRes.ok) {
            notify(`Erreur lors de la création du membre "${row.pseudo}".`, 'error');
            return;
          }
          member = (await createRes.json()) as Member;
          members.push(member);
        }

        const resultRes = await fetch(`${BASE_URL}/tournaments/${tournament.id}/results`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ memberId: member.id, points: row.points, rank: row.rank }),
        });
        if (!resultRes.ok) {
          notify(`Erreur lors de l'ajout du résultat pour "${row.pseudo}".`, 'error');
          return;
        }

        setProgress({ done: i + 1, total: rows.length });
      }

      notify(`Import terminé — ${rows.length} résultat${rows.length > 1 ? 's' : ''} importé${rows.length > 1 ? 's' : ''}.`, 'success');
      setFileName('');
      form.reset();

    } catch (err) {
      notify(err instanceof Error ? err.message : "Erreur pendant l'import.", 'error');
    } finally {
      setProgress(null);
    }
  }

  const isLoading = importStatus === 'loading';
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      {/* Format hint */}
      <div style={styles.formatHint}>
        <span style={styles.formatHintTitle}>Formats acceptés</span>
        <div style={styles.formatGrid}>
          {[
            ['Générique', 'rank, pseudo, points'],
            ['Lichess',   'Rank, Username, Points'],
            ['Chess.com', 'Rk, Username, Score'],
          ].map(([label, cols]) => (
            <div key={label} style={styles.formatItem}>
              <span style={styles.formatLabel}>{label}</span>
              <code style={styles.formatCode}>{cols}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={importCsv} style={styles.form}>

        {/* Tournament name */}
        <div style={styles.field}>
          <label htmlFor="ic-name" style={styles.label}>Nom du tournoi</label>
          <input
            id="ic-name"
            name="name"
            placeholder="Blitz du dimanche #12"
            required
            disabled={isLoading}
            style={styles.input}
          />
        </div>

        {/* Platform + TimeControl */}
        <div style={styles.row2}>
          <div style={styles.field}>
            <label htmlFor="ic-platform" style={styles.label}>Plateforme</label>
            <select id="ic-platform" name="platform" disabled={isLoading} style={styles.select}>
              <option value="LICHESS">Lichess</option>
              <option value="CHESSCOM">Chess.com</option>
              <option value="OTHER">Autre / CSV générique</option>
            </select>
          </div>
          <div style={styles.field}>
            <label htmlFor="ic-timeControl" style={styles.label}>Cadence</label>
            <select id="ic-timeControl" name="timeControl" disabled={isLoading} style={styles.select}>
              <option value="BULLET">Bullet</option>
              <option value="BLITZ">Blitz</option>
              <option value="RAPID">Rapide</option>
              <option value="CLASSICAL">Classique</option>
            </select>
          </div>
        </div>

        {/* Date */}
        <div style={styles.field}>
          <label htmlFor="ic-date" style={styles.label}>Date du tournoi</label>
          <input
            id="ic-date"
            name="date"
            type="date"
            required
            disabled={isLoading}
            style={styles.input}
          />
        </div>

        {/* File picker */}
        <div style={styles.field}>
          <label htmlFor="ic-csv" style={styles.label}>Fichier CSV</label>
          <label
            htmlFor="ic-csv"
            style={{ ...styles.fileLabel, ...(isLoading ? styles.fileLabelDisabled : {}) }}
          >
            <span style={{ fontSize: 18 }}>📂</span>
            <span style={{ color: fileName ? '#1a1a1a' : '#aaa', fontSize: 14 }}>
              {fileName || 'Choisir un fichier .csv…'}
            </span>
            {fileName && (
              <span style={styles.fileClearBtn}
                role="button"
                tabIndex={0}
                aria-label="Effacer le fichier"
                onClick={(ev) => {
                  ev.preventDefault();
                  setFileName('');
                  if (formRef.current) {
                    const fi = formRef.current.elements.namedItem('csv') as HTMLInputElement;
                    fi.value = '';
                  }
                }}
              >✕</span>
            )}
          </label>
          <input
            id="ic-csv"
            name="csv"
            type="file"
            accept=".csv"
            required
            disabled={isLoading}
            style={{ display: 'none' }}
            onChange={(ev) => setFileName(ev.target.files?.[0]?.name ?? '')}
          />
        </div>

        {/* Progress bar */}
        {isLoading && progress && (
          <div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${pct}%` }} />
            </div>
            <p style={styles.progressLabel}>
              {progress.done} / {progress.total} résultats importés…
            </p>
          </div>
        )}

        {/* Notification */}
        {importStatus === 'success' && (
          <div style={{ ...styles.notif, ...styles.notifSuccess }} role="status">
            ✓ {message}
          </div>
        )}
        {importStatus === 'error' && (
          <div style={{ ...styles.notif, ...styles.notifError }} role="alert">
            ⚠ {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
        >
          {isLoading ? 'Import en cours…' : '↑ Importer le fichier'}
        </button>
      </form>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },

  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#555',
  },

  input: {
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#1a1a1a',
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    outline: 'none',
    width: '100%',
  },

  select: {
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#1a1a1a',
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  },

  /* file picker */
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8CDD8',
    borderRadius: 8,
    cursor: 'pointer',
  },
  fileLabelDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  fileClearBtn: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#aaa',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  },

  /* progress */
  progressTrack: {
    height: 6,
    background: '#E8EBF0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    background: GREEN,
    borderRadius: 999,
    transition: 'width 0.2s ease',
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
  },

  /* notifications */
  notif: {
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  notifSuccess: {
    background: '#E1F5EE',
    borderColor: '#9FE1CB',
    color: '#0F6E56',
  },
  notifError: {
    background: '#FCEBEB',
    borderColor: '#f7c1c1',
    color: '#a32d2d',
  },

  /* submit */
  submitBtn: {
    padding: '10px 18px',
    background: GREEN,
    color: '#fff',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'Inter, Arial, sans-serif',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  /* format hint */
  formatHint: {
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E8EBF0',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 18,
  },
  formatHintTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: 8,
  },
  formatGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  formatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  formatLabel: {
    fontSize: 12,
    color: '#666',
    width: 70,
    flexShrink: 0,
  },
  formatCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#3A75C4',
    background: '#EEF3FB',
    padding: '2px 8px',
    borderRadius: 4,
  },
};