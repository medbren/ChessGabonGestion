'use client';

import { useState } from 'react';

/* ─── Constants ──────────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const GREEN = '#009E60';

/* ─── Types ──────────────────────────────────────────────────── */

type Platform    = 'LICHESS' | 'CHESSCOM' | 'OTHER';
type TimeControl = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
type NotifType   = 'success' | 'error' | 'idle';

interface TournamentPayload {
  name:        string;
  platform:    Platform;
  timeControl: TimeControl;
  date:        string;
}

/* ─── Component ─────────────────────────────────────────────── */

export default function TournamentForm() {
  const [status,  setStatus]  = useState<NotifType>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function notify(msg: string, type: NotifType) {
    setMessage(msg);
    setStatus(type);
    if (type === 'success') setTimeout(() => setStatus('idle'), 5000);
  }

  async function createTournament(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    const form = e.currentTarget;
    const fd   = new FormData(form);

    const payload: TournamentPayload = {
      name:        fd.get('name')        as string,
      platform:    fd.get('platform')    as Platform,
      timeControl: fd.get('timeControl') as TimeControl,
      date:        fd.get('date')        as string,
    };

    try {
      const res = await fetch(`${BASE_URL}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        notify('Tournoi créé avec succès.', 'success');
        form.reset();
      } else {
        const text = await res.text();
        notify(`Erreur ${res.status} : ${text || 'réponse inattendue du serveur.'}`, 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur. Vérifiez votre connexion.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createTournament} style={styles.form}>

      {/* Name */}
      <div style={styles.field}>
        <label htmlFor="tf-name" style={styles.label}>Nom du tournoi</label>
        <input
          id="tf-name"
          name="name"
          placeholder="Blitz du dimanche #12"
          required
          disabled={loading}
          style={styles.input}
        />
      </div>

      {/* Platform + TimeControl */}
      <div style={styles.row2}>
        <div style={styles.field}>
          <label htmlFor="tf-platform" style={styles.label}>Plateforme</label>
          <select id="tf-platform" name="platform" disabled={loading} style={styles.select}>
            <option value="LICHESS">Lichess</option>
            <option value="CHESSCOM">Chess.com</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div style={styles.field}>
          <label htmlFor="tf-timeControl" style={styles.label}>Cadence</label>
          <select id="tf-timeControl" name="timeControl" disabled={loading} style={styles.select}>
            <option value="BULLET">Bullet</option>
            <option value="BLITZ">Blitz</option>
            <option value="RAPID">Rapide</option>
            <option value="CLASSICAL">Classique</option>
          </select>
        </div>
      </div>

      {/* Date */}
      <div style={styles.field}>
        <label htmlFor="tf-date" style={styles.label}>Date du tournoi</label>
        <input
          id="tf-date"
          name="date"
          type="date"
          required
          disabled={loading}
          style={styles.input}
        />
      </div>

      {/* Notification */}
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

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
        >
          {loading ? 'Création…' : '+ Créer le tournoi'}
        </button>
      </div>

    </form>
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
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
};