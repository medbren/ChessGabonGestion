'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Trophy,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import {
  AdminPageSkeleton,
  AdminTableSkeleton,
} from '@/components/ui/Skeleton';
import { apiFetch, clearSession, getToken } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Member, MemberDetail } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import TournamentForm from './TournamentForm';
import TournamentList from './TournamentList';
import ImportCsvForm from './ImportCsvForm';

type Tab = 'members' | 'tournaments' | 'import';
type SortColumn = keyof Pick<
  Member,
  'id' | 'pseudo' | 'firstName' | 'lastName' | 'lichess' | 'chesscom'
>;
type SortDirection = 'asc' | 'desc';
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

const TABS: {
  id: Tab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'members',
    label: 'Membres',
    shortLabel: 'Membres',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'tournaments',
    label: 'Tournois',
    shortLabel: 'Tournois',
    icon: <Trophy className="h-4 w-4" />,
  },
  {
    id: 'import',
    label: 'Import CSV',
    shortLabel: 'CSV',
    icon: <Upload className="h-4 w-4" />,
  },
];

function MemberFormFields({ defaults }: { defaults?: Member }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="firstName"
          name="firstName"
          label="Prénom"
          placeholder="Jean"
          defaultValue={defaults?.firstName}
          required
        />
        <Input
          id="lastName"
          name="lastName"
          label="Nom"
          placeholder="Ndong"
          defaultValue={defaults?.lastName}
          required
        />
      </div>
      <Input
        id="pseudo"
        name="pseudo"
        label="Pseudo"
        placeholder="KingNdong"
        required
        defaultValue={defaults?.pseudo}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="lichess"
          name="lichess"
          label="Lichess"
          placeholder="pseudo-lichess"
          defaultValue={defaults?.lichess}
        />
        <Input
          id="chesscom"
          name="chesscom"
          label="Chess.com"
          placeholder="pseudo-chesscom"
          defaultValue={defaults?.chesscom}
        />
      </div>
    </>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [ready, setReady] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('pseudo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [addLoading, setAddLoading] = useState(false);
  const [stats, setStats] = useState<{
    membersCount: number;
    tournamentsCount: number;
    resultsCount: number;
    lastTournamentName?: string;
  } | null>(null);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const res = await apiFetch(path, options);
    if (res.status === 401) logout();
    return res;
  }

  const loadDashboard = useCallback(async () => {
    try {
      const res = await authFetch('/rankings/dashboard');
      if (!res.ok) return;
      const data = (await res.json()) as {
        membersCount: number;
        tournamentsCount: number;
        resultsCount: number;
        lastTournament?: { name?: string } | null;
      };
      setStats({
        membersCount: data.membersCount ?? 0,
        tournamentsCount: data.tournamentsCount ?? 0,
        resultsCount: data.resultsCount ?? 0,
        lastTournamentName: data.lastTournament?.name,
      });
    } catch {
      /* network */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await authFetch('/members');
      if (!res.ok) return;
      const data: unknown = await res.json();
      setMembers(Array.isArray(data) ? (data as Member[]) : []);
      void loadDashboard();
    } catch {
      /* network */
    } finally {
      setMembersLoading(false);
    }
  }, [loadDashboard]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMemberResults(id: number) {
    try {
      const res = await authFetch(`/members/${id}/results`);
      if (res.ok) {
        const data = (await res.json()) as MemberDetail;
        setSelectedMember(data);
      }
    } catch {
      /* network */
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
    void loadMembers();
    void loadDashboard();
  }, [loadMembers, loadDashboard, router]);

  function readFormData(form: HTMLFormElement): MemberFormData {
    const fd = new FormData(form);
    return {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      pseudo: fd.get('pseudo') as string,
      lichess: fd.get('lichess') as string,
      chesscom: fd.get('chesscom') as string,
    };
  }

  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await authFetch('/members', {
        method: 'POST',
        body: JSON.stringify(readFormData(e.currentTarget)),
      });
      if (res.ok) {
        toast.success('Membre ajouté avec succès');
        e.currentTarget.reset();
        void loadMembers();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    } finally {
      setAddLoading(false);
    }
  }

  async function updateMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await authFetch(`/members/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify(readFormData(e.currentTarget)),
      });
      if (res.ok) {
        toast.success('Membre modifié avec succès');
        setEditingMember(null);
        void loadMembers();
      } else {
        toast.error('Erreur lors de la modification');
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    }
  }

  async function deleteMember(member: Member) {
    const ok = confirm(
      `Supprimer le membre « ${member.pseudo} » ?\n\nSes résultats de tournoi seront également supprimés. Cette action est irréversible.`
    );
    if (!ok) return;
    try {
      const res = await authFetch(`/members/${member.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Membre « ${member.pseudo} » supprimé`);
        if (selectedMember?.id === member.id) setSelectedMember(null);
        if (editingMember?.id === member.id) setEditingMember(null);
        void loadMembers();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Impossible de contacter le serveur');
    }
  }

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
      return va < vb
        ? sortDirection === 'asc'
          ? -1
          : 1
        : va > vb
          ? sortDirection === 'asc'
            ? 1
            : -1
          : 0;
    });

  if (!ready) return <AdminPageSkeleton />;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/" size="sm" />
            <Badge variant="brand">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm text-muted transition hover:text-brand sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Site public
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-10 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-2 sm:px-6">
          <nav
            aria-label="Sections administration"
            className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-none sm:px-0"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 sm:flex-1 sm:gap-2 sm:px-4 sm:py-2.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                  tab === t.id
                    ? 'bg-brand text-white shadow-md'
                    : 'text-gray-600 hover:bg-brand-light hover:text-brand active:scale-[0.98]'
                )}
              >
                {t.icon}
                <span className="sm:hidden">{t.shortLabel}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-xs font-medium text-muted">Membres</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{stats.membersCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-xs font-medium text-muted">Tournois</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{stats.tournamentsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-xs font-medium text-muted">Résultats</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{stats.resultsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-xs font-medium text-muted">Dernier tournoi</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900" title={stats.lastTournamentName}>
                {stats.lastTournamentName || '—'}
              </p>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-6">
            <Card title="Ajouter un membre">
              <form onSubmit={addMember} className="space-y-4">
                <MemberFormFields />
                <Button type="submit" loading={addLoading}>
                  {addLoading ? 'Ajout…' : '+ Ajouter le membre'}
                </Button>
              </form>
            </Card>

            {editingMember && (
              <Card
                title={`Modifier — ${editingMember.pseudo}`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)}>
                    Annuler
                  </Button>
                }
              >
                <form onSubmit={updateMember} className="space-y-4">
                  <MemberFormFields defaults={editingMember} />
                  <Button type="submit">Enregistrer</Button>
                </form>
              </Card>
            )}

            <Card
              title="Liste des membres"
              action={
                <Badge variant="gray">
                  {membersLoading
                    ? '…'
                    : `${filteredMembers.length} membre${filteredMembers.length !== 1 ? 's' : ''}`}
                </Badge>
              }
            >
              {membersLoading ? (
                <AdminTableSkeleton />
              ) : (
                <>
                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Pseudo, nom, Lichess, Chess.com…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        aria-label="Rechercher un membre"
                      />
                      {searchTerm ? (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100"
                          aria-label="Effacer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <EmptyState
                      variant="empty"
                      title="Aucun membre"
                      message="Ajoutez votre premier membre ou importez un CSV."
                    />
                  ) : filteredMembers.length === 0 ? (
                    <EmptyState
                      variant="search"
                      title="Aucun résultat"
                      message="Aucun membre ne correspond à votre recherche."
                      action={
                        <button type="button" onClick={() => setSearchTerm('')} className="text-sm font-medium text-brand hover:underline">
                          Effacer la recherche
                        </button>
                      }
                    />
                  ) : (
                    <>
                      <ul className="space-y-2 sm:hidden">
                        {filteredMembers.map((m) => (
                          <li key={m.id} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                            <div className="flex items-start gap-3">
                              <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                              <div className="min-w-0 flex-1">
                                <button type="button" className="text-left font-semibold text-gray-900 hover:text-brand" onClick={() => void loadMemberResults(m.id)}>
                                  {m.pseudo}
                                </button>
                                <p className="truncate text-xs text-muted">{m.firstName} {m.lastName}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {m.lichess ? <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-border">Lichess · {m.lichess}</span> : null}
                                  {m.chesscom ? <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-border">Chess.com · {m.chesscom}</span> : null}
                                  {!m.lichess && !m.chesscom ? <span className="text-[10px] text-muted">Pas de comptes liés</span> : null}
                                </div>
                              </div>
                              <details className="relative shrink-0">
                                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-gray-100 [&::-webkit-details-marker]:hidden" aria-label={`Actions ${m.pseudo}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </summary>
                                <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
                                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50" onClick={() => void loadMemberResults(m.id)}>
                                    <UserRound className="h-3.5 w-3.5" /> Voir la fiche
                                  </button>
                                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50" onClick={() => setEditingMember(m)}>
                                    <Pencil className="h-3.5 w-3.5" /> Modifier
                                  </button>
                                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => void deleteMember(m)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                  </button>
                                </div>
                              </details>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead>
                            <tr className="bg-brand text-white">
                              {([['pseudo', 'Joueur'], ['firstName', 'Prénom'], ['lastName', 'Nom'], ['lichess', 'Lichess'], ['chesscom', 'Chess.com']] as [SortColumn, string][]).map(([col, label]) => (
                                <th key={col} className="px-3 py-2.5 font-medium">
                                  <button type="button" onClick={() => sortBy(col)} className="inline-flex items-center gap-1.5 hover:underline">
                                    {label}
                                    {sortColumn === col ? (sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                                  </button>
                                </th>
                              ))}
                              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white">
                            {filteredMembers.map((m) => (
                              <tr key={m.id} className="table-row-interactive">
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                                    <button type="button" className="font-medium text-gray-900 hover:text-brand hover:underline" onClick={() => void loadMemberResults(m.id)}>
                                      {m.pseudo}
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-muted">{m.firstName}</td>
                                <td className="px-3 py-2.5 text-muted">{m.lastName}</td>
                                <td className="px-3 py-2.5">{m.lichess ? <span className="font-medium">{m.lichess}</span> : <span className="text-muted">—</span>}</td>
                                <td className="px-3 py-2.5">{m.chesscom ? <span className="font-medium">{m.chesscom}</span> : <span className="text-muted">—</span>}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex justify-end gap-1.5">
                                    <Button size="sm" variant="ghost" onClick={() => void loadMemberResults(m.id)} aria-label="Fiche">
                                      <UserRound className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setEditingMember(m)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => void deleteMember(m)} aria-label="Supprimer">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>

            {selectedMember && (
              <Card
                title={`Résultats — ${selectedMember.pseudo}`}
                action={
                  <Button size="sm" variant="ghost" onClick={() => setSelectedMember(null)}>
                    Fermer
                  </Button>
                }
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-brand-light px-3 py-2">
                    <span className="text-xs font-medium text-brand-dark">Points</span>
                    <span className="text-sm font-bold tabular-nums text-brand-dark">{selectedMember.totalPoints}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 ring-1 ring-border">
                    <span className="text-xs font-medium text-muted">Tournois</span>
                    <span className="text-sm font-bold tabular-nums">{selectedMember.tournamentsPlayed}</span>
                  </div>
                </div>
                {selectedMember.results?.length ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600">
                          <th className="px-3 py-2 font-medium">Tournoi</th>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 text-right font-medium">Rang</th>
                          <th className="px-3 py-2 text-right font-medium">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedMember.results.map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2 font-medium">{r.tournament.name}</td>
                            <td className="px-3 py-2 text-muted">{formatDate(r.tournament.date)}</td>
                            <td className="px-3 py-2 text-right">{r.rank ?? '—'}</td>
                            <td className="px-3 py-2 text-right font-semibold">{r.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState variant="empty" title="Pas encore de résultats" message="Ce membre n’a participé à aucun tournoi enregistré." />
                )}
              </Card>
            )}
          </div>
        )}

        {tab === 'tournaments' && (
          <div className="space-y-6">
            <Card title="Créer un tournoi">
              <TournamentForm />
            </Card>
            <Card title="Liste des tournois">
              <TournamentList />
            </Card>
          </div>
        )}

        {tab === 'import' && (
          <Card title="Importer un classement CSV">
            <ImportCsvForm />
          </Card>
        )}
      </main>
    </div>
  );
}