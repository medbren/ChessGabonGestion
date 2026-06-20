'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Constants ──────────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const GREEN = '#009E60';

/* ─── Types ──────────────────────────────────────────────────── */

type Platform    = 'LICHESS' | 'CHESSCOM' | 'OTHER';
type TimeControl = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
type NotifType   = 'success' | 'error' | 'idle';

interface Tournament {
  id:          number;
  name:        string;
  platform:    Platform;
  timeControl: TimeControl;
  date:        string;
  results?:    unknown[];
}

const PLATFORM_LABELS: Record<Platform, string> = {
  LICHESS:  'Lichess',
  CHESSCOM: 'Chess.com',
  OTHER:    'Autre',
};

const TIME_CONTROL_LABELS: Record<TimeControl, string> = {
  BULLET:    'Bullet',
  BLITZ:     'Blitz',
  RAPID:     'Rapide',
  CLASSICAL: 'Classique',
};

/* ─── Component ─────────────────────────────────────────────── */

export default function TournamentList() {
  const [tournaments,      setTournaments]      = useState<Tournament[]>([]);
  const [editingTournament,setEditingTournament]= useState<Tournament | null>(null);
  const [status,           setStatus]           = useState<NotifType>('idle');
  const [message,          setMessage]          = useState('');
  const [loading,          setLoading]          = useState(false);

  function getToken(): string | null {
    return localStorage.getItem('token');
  }

  function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: `Bearer ${getToken()}`, ...extra };
  }

  function notify(msg: string, type: NotifType) {
    setMessage(msg);
    setStatus(type);
    if (type === 'success') setTimeout(() => setStatus('idle'), 4000);
  }

  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/tournaments`, { headers: authHeaders() });
      if (!res.ok) return;
      const data: unknown = await res.json();
      setTournaments(Array.isArray(data) ? (data as Tournament[]) : []);
    } catch { /* network error */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadTournaments(); }, [loadTournaments]);

  async function updateTournament(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTournament) return;
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name:        fd.get('name')        as string,
      platform:    fd.get('platform')    as Platform,
      timeControl: fd.get('timeControl') as TimeControl,
      date:        fd.get('date')        as string,
    };

    try {
      const res = await fetch(`${BASE_URL}/tournaments/${editingTournament.id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        notify('Tournoi modifié avec succès.', 'success');
        setEditingTournament(null);
        void loadTournaments();
      } else {
        notify(`Erreur ${res.status} lors de la modification.`, 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTournament(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce tournoi et tous ses résultats ?')) return;

    try {
      const res = await fetch(`${BASE_URL}/tournaments/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.ok) {
        notify('Tournoi supprimé.', 'success');
        if (editingTournament?.id === id) setEditingTournament(null);
        void loadTournaments();
      } else {
        notify(`Erreur ${res.status} lors de la suppression.`, 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur.', 'error');
    }
  }

  return (
    <div>

      {/* ── Notification ── */}
      {status === 'success' && (
        <div style={{ ...styles.notif, ...styles.notifSuccess }} role="status">
          ✓ {message}
        </div>
      )}
      {status === 'error' && (
        <div style={{ ...styles.notif, ...styles.notifError }} role="alert">
          ⚠ {message}
        </div>
      )}

      {/* ── Edit form (conditional) ── */}
      {editingTournament && (
        <div style={styles.editCard}>
          <p style={styles.editTitle}>Modifier — {editingTournament.name}</p>
          <form onSubmit={updateTournament} style={styles.form}>

            <div style={styles.field}>
              <label htmlFor="tl-name" style={styles.label}>Nom du tournoi</label>
              <input
                id="tl-name"
                name="name"
                defaultValue={editingTournament.name}
                required
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label htmlFor="tl-platform" style={styles.label}>Plateforme</label>
                <select
                  id="tl-platform"
                  name="platform"
                  defaultValue={editingTournament.platform}
                  disabled={loading}
                  style={styles.select}
                >
                  <option value="LICHESS">Lichess</option>
                  <option value="CHESSCOM">Chess.com</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div style={styles.field}>
                <label htmlFor="tl-timeControl" style={styles.label}>Cadence</label>
                <select
                  id="tl-timeControl"
                  name="timeControl"
                  defaultValue={editingTournament.timeControl}
                  disabled={loading}
                  style={styles.select}
                >
                  <option value="BULLET">Bullet</option>
                  <option value="BLITZ">Blitz</option>
                  <option value="RAPID">Rapide</option>
                  <option value="CLASSICAL">Classique</option>
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label htmlFor="tl-date" style={styles.label}>Date</label>
              <input
                id="tl-date"
                name="date"
                type="date"
                defaultValue={editingTournament.date.slice(0, 10)}
                required
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.primaryBtn, ...(loading ? styles.btnDisabled : {}) }}
              >
                {loading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                style={styles.ghostBtn}
                onClick={() => setEditingTournament(null)}
              >
                Annuler
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ── Table ── */}
      {tournaments.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>♟</span>
          Aucun tournoi enregistré.
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, width: 48 }}>ID</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Plateforme</th>
                <th style={styles.th}>Cadence</th>
                <th style={styles.th}>Date</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Résultats</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    ...styles.row,
                    ...(editingTournament?.id === t.id ? styles.rowSelected : {}),
                  }}
                >
                  <td style={{ ...styles.td, color: '#aaa', fontSize: 12 }}>{t.id}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{t.name}</td>
                  <td style={styles.td}>
                    <span style={styles.platformBadge}>{PLATFORM_LABELS[t.platform] ?? t.platform}</span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: '#555' }}>
                    {TIME_CONTROL_LABELS[t.timeControl] ?? t.timeControl}
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: '#555' }}>
                    {new Date(t.date).toLocaleDateString('fr-GA')}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={styles.countBadge}>{t.results?.length ?? 0}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={styles.actionBtn}
                        onClick={() => { setEditingTournament(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        Modifier
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                        onClick={() => void deleteTournament(t.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {

  /* notification */
  notif: {
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 14,
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

  /* edit card */
  editCard: {
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 10,
    padding: '1rem 1.25rem',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: 14,
  },

  /* form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
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
    background: '#fff',
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
    background: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  },

  /* buttons */
  primaryBtn: {
    padding: '9px 18px',
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
  },
  ghostBtn: {
    padding: '9px 18px',
    background: '#fff',
    color: '#555',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter, Arial, sans-serif',
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  actionBtn: {
    padding: '5px 10px',
    fontSize: 12,
    background: '#F5F7FA',
    color: '#444',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'Inter, Arial, sans-serif',
    whiteSpace: 'nowrap' as const,
  },
  actionBtnDanger: {
    background: '#FCEBEB',
    color: '#a32d2d',
    borderColor: '#f7c1c1',
  },

  /* table */
  tableWrapper: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    background: GREEN,
    color: '#fff',
  },
  th: {
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid' as const,
    borderBottomColor: '#F0F2F5',
  },
  rowSelected: {
    background: '#F0FBF6',
  },
  td: {
    padding: '10px 14px',
    fontSize: 14,
    verticalAlign: 'middle' as const,
  },

  /* badges */
  platformBadge: {
    display: 'inline-block',
    fontSize: 12,
    background: '#EEF3FB',
    color: '#3A75C4',
    padding: '2px 8px',
    borderRadius: 999,
  },
  countBadge: {
    display: 'inline-block',
    fontSize: 12,
    background: '#F0F2F5',
    color: '#666',
    padding: '2px 8px',
    borderRadius: 999,
  },

  /* empty */
  emptyState: {
    padding: '2.5rem 1rem',
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
  },
};