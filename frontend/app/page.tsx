'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────── */

interface Player {
  id: string | number;
  rank: number;
  pseudo: string;
  fullName: string;
  points: number;
  rawPoints: number;
  tournaments: number;
}

interface Filter {
  label: string;
  query: string;
  icon: string;
}

/* ─── Constants ─────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const FILTERS: Filter[] = [
  { label: 'Général',  query: '',                                    icon: '🏆' },
  { label: 'Blitz',    query: '?timeControl=BLITZ',                  icon: '⚡' },
  { label: 'Rapide',   query: '?timeControl=RAPID',                  icon: '⏱' },
  { label: 'Mensuel',  query: '?type=monthly&month=6&year=2026',     icon: '📅' },
  { label: 'Annuel',   query: '?type=yearly&year=2026',              icon: '📊' },
];

/* ─── Helpers ───────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    fontSize: 13,
    fontWeight: 500,
  };

  if (rank === 1) return <span style={{ ...base, background: '#FCD116', color: '#7a5a00' }}>{rank}</span>;
  if (rank === 2) return <span style={{ ...base, background: '#d1d1d1', color: '#444' }}>{rank}</span>;
  if (rank === 3) return <span style={{ ...base, background: '#d4a76a', color: '#6b3d00' }}>{rank}</span>;
  return <span style={{ ...base, background: '#F0F2F5', color: '#666' }}>{rank}</span>;
}

function Avatar({ name }: { name: string }) {
  return (
    <span style={styles.avatar}>{getInitials(name)}</span>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function EmptyState({ message }: { message: string }) {
  return (
    <div style={styles.emptyState}>
      <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>♟</span>
      {message}
    </div>
  );
}

function Spinner() {
  return <span style={styles.spinner} aria-hidden="true" />;
}

function TableRow({ player }: { player: Player }) {
  return (
    <tr style={styles.row}>
      <td style={styles.tdCenter}>
        <RankBadge rank={player.rank} />
      </td>
      <td>
        <div style={styles.pseudoCell}>
          <Avatar name={player.fullName ?? player.pseudo} />
          <span style={styles.pseudoText}>{player.pseudo || '—'}</span>
        </div>
      </td>
      <td style={styles.fullName}>{player.fullName || '—'}</td>
      <td style={styles.tdRight}>
        <span style={styles.pointsVal}>{player.points ?? '—'}</span>
      </td>
      <td style={styles.tdRight}>
        <span style={styles.rawVal}>{player.rawPoints ?? '—'}</span>
      </td>
      <td style={styles.tdRight}>
        <span style={styles.tournBadge}>♞ {player.tournaments ?? 0}</span>
      </td>
    </tr>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export default function HomePage() {
  const [rankings, setRankings] = useState<Player[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>(FILTERS[0]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

  const loadRankings = useCallback(async (filter: Filter) => {
    setActiveFilter(filter);
    setStatus('loading');
    setRankings([]);

    try {
      const res = await fetch(`${BASE_URL}/rankings${filter.query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      setRankings(Array.isArray(data) ? (data as Player[]) : []);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadRankings(FILTERS[0]);
  }, [loadRankings]);

  return (
    <main style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>♟</div>
          <h1 style={styles.logoText}>
            <span style={styles.logoAccent}>Chess</span>
            Gabon
            <span style={styles.logoMuted}>Gestion</span>
          </h1>
        </div>
        <p style={styles.subtitle}>Gestion des tournois &amp; classements officiels du club</p>
      </header>

      {/* ── Filters ── */}
      <nav aria-label="Filtres de classement" style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            style={{
              ...styles.filterBtn,
              ...(activeFilter.label === f.label ? styles.filterBtnActive : {}),
            }}
            onClick={() => void loadRankings(f)}
            aria-pressed={activeFilter.label === f.label}
          >
            {f.icon} {f.label}
          </button>
        ))}

        <a href="/login" style={styles.adminBtn}>
          ⚙ Administration
        </a>
      </nav>

      {/* ── Section bar ── */}
      <div style={styles.sectionBar}>
        <span style={styles.sectionTitle}>
          # Classement {activeFilter.label}
        </span>
        <span style={styles.countBadge}>
          {status === 'loading' ? '…' : `${rankings.length} joueur${rankings.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={styles.tableCard}>
        {status === 'loading' && (
          <div style={styles.emptyState}>
            <Spinner /> Chargement…
          </div>
        )}

        {status === 'error' && (
          <EmptyState message="Impossible de contacter le serveur. Vérifiez votre connexion." />
        )}

        {status === 'idle' && rankings.length === 0 && (
          <EmptyState message="Aucun joueur dans ce classement." />
        )}

        {status === 'idle' && rankings.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={{ ...styles.th, ...styles.tdCenter, width: 60 }}>Rang</th>
                  <th style={styles.th}>Joueur</th>
                  <th style={styles.th}>Nom complet</th>
                  <th style={{ ...styles.th, ...styles.tdRight }}>Points</th>
                  <th style={{ ...styles.th, ...styles.tdRight }}>Score brut</th>
                  <th style={{ ...styles.th, ...styles.tdRight }}>Tournois</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((p) => (
                  <TableRow key={p.id} player={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const GREEN  = '#009E60';
const BLUE   = '#3A75C4';
const YELLOW = '#FCD116';

const styles: Record<string, React.CSSProperties> = {
  /* layout */
  page: {
    maxWidth: 980,
    margin: '40px auto',
    padding: '0 16px 60px',
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#1a1a1a',
  },

  /* header */
  header: {
    textAlign: 'center',
    padding: '2rem 0 1.5rem',
    borderBottom: '1px solid #E8EBF0',
    marginBottom: '1.5rem',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoIcon: {
    width: 40,
    height: 40,
    background: GREEN,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 22,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 500,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  logoAccent: { color: GREEN },
  logoMuted:  { color: '#888', fontWeight: 400 },
  subtitle: {
    fontSize: 14,
    color: '#666',
    margin: 0,
  },

  /* filters */
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  filterBtn: {
    background: '#F5F7FA',
    color: '#555',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    background: GREEN,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: GREEN,
    color: '#fff',
  },
  adminBtn: {
    padding: '8px 16px',
    background: YELLOW,
    color: '#222',
    border: '1px solid #e0bb00',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },

  /* section bar */
  sectionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#1a1a1a',
  },
  countBadge: {
    fontSize: 12,
    background: '#F0F2F5',
    color: '#666',
    border: '1px solid #E0E4EC',
    padding: '2px 10px',
    borderRadius: 999,
  },

  /* table card */
  tableCard: {
    background: '#fff',
    border: '1px solid #E8EBF0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  theadRow: {
    background: GREEN,
    color: '#fff',
  },
  th: {
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'left',
  },
  row: {
    borderBottom: '1px solid #F0F2F5',
    transition: 'background 0.1s',
  },

  /* cell helpers */
  tdCenter: { textAlign: 'center' },
  tdRight:  { textAlign: 'right'  },

  /* player cells */
  pseudoCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#E1F5EE',
    color: '#0F6E56',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
  },
  pseudoText: {
    fontWeight: 500,
    color: BLUE,
    fontSize: 14,
  },
  fullName: {
    color: '#666',
    fontSize: 13,
    padding: '11px 14px',
  },
  pointsVal: {
    fontWeight: 500,
    fontSize: 14,
    padding: '11px 14px',
    display: 'block',
  },
  rawVal: {
    color: '#888',
    fontSize: 13,
    padding: '11px 14px',
    display: 'block',
  },
  tournBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#F5F7FA',
    color: '#666',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
  },

  /* states */
  emptyState: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '2px solid #E0E4EC',
    borderTopColor: GREEN,
    animation: 'spin 0.6s linear infinite',
  },
};