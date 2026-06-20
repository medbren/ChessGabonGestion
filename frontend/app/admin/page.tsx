'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TournamentForm from './TournamentForm';
import ImportCsvForm from './ImportCsvForm';
import TournamentList from './TournamentList';

/* ─── Constants ──────────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// const GREEN = '#009E60';

/* ─── Types ──────────────────────────────────────────────────── */

interface Member {
  id: number;
  pseudo: string;
  firstName: string;
  lastName: string;
  lichess?: string;
  chesscom?: string;
}

interface TournamentResult {
  id: number;
  rank: number | null;
  points: number;
  tournament: {
    name: string;
    platform: string;
    timeControl: string;
    date: string;
  };
}

interface MemberDetail extends Member {
  totalPoints: number;
  tournamentsPlayed: number;
  results: TournamentResult[];
}

interface MemberFormData {
  firstName: string;
  lastName: string;
  pseudo: string;
  lichess: string;
  chesscom: string;
}

type SortColumn = keyof Pick<Member, 'id' | 'pseudo' | 'firstName' | 'lastName' | 'lichess' | 'chesscom'>;
type SortDirection = 'asc' | 'desc';
type NotifType = 'success' | 'error' | '';

/* ─── Small helpers ──────────────────────────────────────────── */

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getInitials(m: Member): string {
  return `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

/* ─── Sub-components ─────────────────────────────────────────── */

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#fff', marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function Notification({ message, type }: { message: string; type: NotifType }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...styles.notif,
        background: isSuccess ? '#E1F5EE' : '#FCEBEB',
        borderColor: isSuccess ? '#9FE1CB' : '#f7c1c1',
        color: isSuccess ? '#0F6E56' : '#a32d2d',
      }}
    >
      {isSuccess ? '✓' : '⚠'} {message}
    </div>
  );
}

function Avatar({ member }: { member: Member }) {
  return (
    <span style={styles.avatar}>{getInitials(member)}</span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function MemberFormFields({ defaults }: { defaults?: Member }) {
  return (
    <>
      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" placeholder="Jean" defaultValue={defaults?.firstName} required style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" placeholder="Ndong" defaultValue={defaults?.lastName} required style={styles.input} />
        </div>
      </div>
      <div style={styles.field}>
        <label style={styles.label} htmlFor="pseudo">Pseudo</label>
        <input id="pseudo" name="pseudo" placeholder="KingNdong" defaultValue={defaults?.pseudo} required style={styles.input} />
      </div>
      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="lichess">Lichess</label>
          <input id="lichess" name="lichess" placeholder="pseudo-lichess" defaultValue={defaults?.lichess} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="chesscom">Chess.com</label>
          <input id="chesscom" name="chesscom" placeholder="pseudo-chesscom" defaultValue={defaults?.chesscom} style={styles.input} />
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function AdminPage() {
  const router = useRouter();

  const [members,       setMembers]       = useState<Member[]>([]);
  const [ready,         setReady]         = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember,setSelectedMember]= useState<MemberDetail | null>(null);
  const [notif,         setNotif]         = useState<{ message: string; type: NotifType }>({ message: '', type: '' });
  const [searchTerm,    setSearchTerm]    = useState('');
  const [sortColumn,    setSortColumn]    = useState<SortColumn>('pseudo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [addLoading,    setAddLoading]    = useState(false);

  /* ── Auth helpers ── */

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  function notify(message: string, type: NotifType) {
    setNotif({ message, type });
    setTimeout(() => setNotif({ message: '', type: '' }), 4000);
  }

  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
    if (res.status === 401) { logout(); }
    return res;
  }

  /* ── Data loading ── */

  const loadMembers = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/members`);
      if (!res.ok) return;
      const data: unknown = await res.json();
      setMembers(Array.isArray(data) ? (data as Member[]) : []);
    } catch { /* network error */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMemberResults(id: number) {
    try {
      const res = await authFetch(`${BASE_URL}/members/${id}/results`);
      if (res.ok) {
        const data = (await res.json()) as MemberDetail;
        setSelectedMember(data);
      }
    } catch { /* network error */ }
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    setReady(true);
    void loadMembers();
  }, [loadMembers, router]);

  /* ── CRUD handlers ── */

  function readFormData(form: HTMLFormElement): MemberFormData {
    const fd = new FormData(form);
    return {
      firstName: fd.get('firstName') as string,
      lastName:  fd.get('lastName')  as string,
      pseudo:    fd.get('pseudo')    as string,
      lichess:   fd.get('lichess')   as string,
      chesscom:  fd.get('chesscom')  as string,
    };
  }

  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/members`, {
        method: 'POST',
        body: JSON.stringify(readFormData(e.currentTarget)),
      });
      if (res.ok) {
        notify('Membre ajouté avec succès', 'success');
        e.currentTarget.reset();
        void loadMembers();
      } else {
        notify("Erreur lors de l'ajout", 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur', 'error');
    } finally {
      setAddLoading(false);
    }
  }

  async function updateMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await authFetch(`${BASE_URL}/members/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify(readFormData(e.currentTarget)),
      });
      if (res.ok) {
        notify('Membre modifié avec succès', 'success');
        setEditingMember(null);
        void loadMembers();
      } else {
        notify('Erreur lors de la modification', 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur', 'error');
    }
  }

  async function deleteMember(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce membre ?')) return;
    try {
      const res = await authFetch(`${BASE_URL}/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Membre supprimé', 'success');
        if (selectedMember?.id === id) setSelectedMember(null);
        void loadMembers();
      } else {
        notify('Erreur lors de la suppression', 'error');
      }
    } catch {
      notify('Impossible de contacter le serveur', 'error');
    }
  }

  /* ── Sort ── */

  function sortBy(column: SortColumn) {
    setSortColumn(column);
    setSortDirection(sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc');
  }

  const filteredMembers = members
    .filter(({ pseudo, firstName, lastName, lichess, chesscom }) => {
      const s = searchTerm.toLowerCase();
      return [pseudo, firstName, lastName, lichess, chesscom].some((v) =>
        v?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const va = String(a[sortColumn] ?? '').toLowerCase();
      const vb = String(b[sortColumn] ?? '').toLowerCase();
      return va < vb ? (sortDirection === 'asc' ? -1 : 1)
           : va > vb ? (sortDirection === 'asc' ?  1 : -1)
           : 0;
    });

  /* ── Render ── */

  if (!ready) {
    return (
      <div style={styles.loadingScreen}>
        <span style={styles.spinner} aria-hidden="true" />
        Vérification de la connexion…
      </div>
    );
  }

  return (
    <main style={styles.page}>

      {/* ── Top bar ── */}
      <header style={styles.topBar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>♟</div>
          <span style={styles.logoText}>
            <span style={{ color: GREEN }}>Chess</span>Gabon
            <span style={styles.logoMuted}>Gestion</span>
          </span>
          <span style={styles.adminPill}>Administration</span>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>
          Se déconnecter →
        </button>
      </header>

      {/* ── Notification ── */}
      <Notification message={notif.message} type={notif.type} />

      {/* ── Add member ── */}
      <SectionCard title="Ajouter un membre">
        <form onSubmit={addMember} style={styles.form}>
          <MemberFormFields />
          <div>
            <button type="submit" disabled={addLoading} style={styles.primaryBtn}>
              {addLoading ? 'Ajout…' : '+ Ajouter le membre'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Edit member (conditional) ── */}
      {editingMember && (
        <SectionCard title={`Modifier — ${editingMember.pseudo}`}>
          <form onSubmit={updateMember} style={styles.form}>
            <MemberFormFields defaults={editingMember} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={styles.primaryBtn}>Enregistrer</button>
              <button type="button" style={styles.ghostBtn} onClick={() => setEditingMember(null)}>
                Annuler
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── Members list ── */}
      <SectionCard title="Liste des membres">
        <div style={styles.searchRow}>
          <input
            type="search"
            placeholder="Rechercher un joueur…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...styles.input, maxWidth: 320 }}
            aria-label="Rechercher un membre"
          />
          <span style={styles.countBadge}>{filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                {(
                  [
                    ['id',        'ID'       ],
                    ['pseudo',    'Pseudo'   ],
                    ['firstName', 'Nom'      ],
                    ['lichess',   'Lichess'  ],
                    ['chesscom',  'Chess.com'],
                  ] as [SortColumn, string][]
                ).map(([col, label]) => (
                  <th
                    key={col}
                    style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => sortBy(col)}
                    aria-sort={sortColumn === col ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    {label}
                    <SortIcon active={sortColumn === col} dir={sortDirection} />
                  </th>
                ))}
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.emptyCell}>Aucun membre trouvé.</td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      ...styles.row,
                      ...(selectedMember?.id === m.id ? styles.rowSelected : {}),
                    }}
                  >
                    <td style={{ ...styles.td, color: '#aaa', fontSize: 12 }}>{m.id}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar member={m} />
                        <span style={{ fontWeight: 500, color: '#3A75C4' }}>{m.pseudo}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{m.firstName} {m.lastName}</td>
                    <td style={{ ...styles.td, color: '#555', fontSize: 13 }}>{m.lichess || '—'}</td>
                    <td style={{ ...styles.td, color: '#555', fontSize: 13 }}>{m.chesscom || '—'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={styles.actionBtn} onClick={() => void loadMemberResults(m.id)}>Fiche</button>
                        <button style={styles.actionBtn} onClick={() => { setEditingMember(m); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Modifier</button>
                        <button style={{ ...styles.actionBtn, ...styles.actionBtnDanger }} onClick={() => void deleteMember(m.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Member detail ── */}
      {selectedMember && (
        <SectionCard title={`Fiche joueur — ${selectedMember.pseudo}`}>
          <div style={styles.memberDetailHeader}>
            <div style={{ ...styles.avatar, width: 48, height: 48, fontSize: 18 }}>
              {getInitials(selectedMember)}
            </div>
            <div>
              <p style={{ fontWeight: 500, fontSize: 16 }}>{selectedMember.firstName} {selectedMember.lastName}</p>
              <p style={{ color: '#888', fontSize: 13 }}>
                Lichess : {selectedMember.lichess || '—'} &nbsp;·&nbsp; Chess.com : {selectedMember.chesscom || '—'}
              </p>
            </div>
            <div style={styles.memberStats}>
              <div style={styles.statBox}>
                <span style={styles.statVal}>{selectedMember.totalPoints}</span>
                <span style={styles.statLabel}>Points</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statVal}>{selectedMember.tournamentsPlayed}</span>
                <span style={styles.statLabel}>Tournois</span>
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  {['Tournoi', 'Plateforme', 'Cadence', 'Date', 'Rang', 'Points'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedMember.results.length === 0 ? (
                  <tr><td colSpan={6} style={styles.emptyCell}>Aucun résultat.</td></tr>
                ) : (
                  selectedMember.results.map((r) => (
                    <tr key={r.id} style={styles.row}>
                      <td style={styles.td}>{r.tournament.name}</td>
                      <td style={styles.td}>{r.tournament.platform}</td>
                      <td style={styles.td}>{r.tournament.timeControl}</td>
                      <td style={styles.td}>{new Date(r.tournament.date).toLocaleDateString('fr-GA')}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>{r.rank ?? '—'}</td>
                      <td style={{ ...styles.td, fontWeight: 500, textAlign: 'right' }}>{r.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button style={{ ...styles.ghostBtn, marginTop: 12 }} onClick={() => setSelectedMember(null)}>
            Fermer la fiche
          </button>
        </SectionCard>
      )}

      {/* ── Sub-forms ── */}
      <SectionCard title="Créer un tournoi"><TournamentForm /></SectionCard>
      <SectionCard title="Importer des résultats CSV"><ImportCsvForm /></SectionCard>
      <SectionCard title="Tournois"><TournamentList /></SectionCard>

    </main>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const GREEN = '#009E60';

const styles: Record<string, React.CSSProperties> = {

  /* layout */
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 16px 80px',
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#1a1a1a',
  },

  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: '100vh',
    fontSize: 15,
    color: '#666',
  },

  /* top bar */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E8EBF0',
    marginBottom: '1.5rem',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 34,
    height: 34,
    background: GREEN,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 18,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 500,
    color: '#1a1a1a',
    letterSpacing: '-0.3px',
  },
  logoMuted: { color: '#888', fontWeight: 400 },
  adminPill: {
    fontSize: 11,
    fontWeight: 500,
    background: '#FCD116',
    color: '#7a5a00',
    padding: '2px 8px',
    borderRadius: 999,
    letterSpacing: '0.02em',
  },
  logoutBtn: {
    fontSize: 13,
    color: '#888',
    background: 'none',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    cursor: 'pointer',
    padding: '6px 0',
  },

  /* notification */
  notif: {
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: '1rem',
  },

  /* section card */
  sectionCard: {
    background: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E8EBF0',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#F0F2F5',
  },

  /* form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    background: '#F5F7FA',
    color: '#555',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter, Arial, sans-serif',
    cursor: 'pointer',
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

  /* search row */
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  countBadge: {
    fontSize: 12,
    background: '#F0F2F5',
    color: '#666',
    padding: '2px 10px',
    borderRadius: 999,
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
  emptyCell: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#aaa',
    fontSize: 14,
  },

  /* avatar */
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

  /* member detail */
  memberDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
  },
  memberStats: {
    display: 'flex',
    gap: 12,
    marginLeft: 'auto',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: '#F7F9FC',
    borderRadius: 8,
    padding: '8px 20px',
  },
  statVal: { fontSize: 20, fontWeight: 500, color: GREEN },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  /* spinner */
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderTopColor: GREEN,
    animation: 'spin 0.6s linear infinite',
  },
};