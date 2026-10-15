'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  Users,
  Trophy,
  Upload,
  Search,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
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
import { apiFetch, getToken } from '@/lib/api';
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
  { id: 'members', label: 'Membres', shortLabel: 'Membres', icon: <Users className="h-4 w-4" /> },
  { id: 'tournaments', label: 'Tournois', shortLabel: 'Tournois', icon: <Trophy className="h-4 w-4" /> },
  { id: 'import', label: 'Import CSV', shortLabel: 'CSV', icon: <Upload className="h-4 w-4" /> },
];

function MemberFormFields({ defaults }: { defaults?: Member }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="firstName" name="firstName" label="Prénom" placeholder="Jean" defaultValue={defaults?.firstName} required />
        <Input id="lastName" name="lastName" label="Nom" placeholder="Ndong" defaultValue={defaults?.lastName} required />
      </div>
      <Input id="pseudo" name="pseudo" label="Pseudo" placeholder="KingNdong" defaultValue={defaults?.pseudo} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="lichess" name="lichess" label="Lichess" placeholder="pseudo-lichess" defaultValue={defaults?.lichess} />
        <Input id="chesscom" name="chesscom" label="Chess.com" placeholder="pseudo-chesscom" defaultValue={defaults?.chesscom} />
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

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const res = await apiFetch(path, options);
    if (res.status === 401) logout();
    return res;
  }

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await authFetch('/members');
      if (!res.ok) return;
      const data: unknown = await res.json();
      setMembers(Array.isArray(data) ? (data as Member[]) : []);
    } catch {
      /* network */
    } finally {
      setMembersLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      router.push('/login');
      return;
    }
    setReady(true);
    void loadMembers();
  }, [loadMembers, router]);

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

  async function deleteMember(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce membre ?')) return;
    try {
      const res = await authFetch(`/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Membre supprimé');
        if (selectedMember?.id === id) setSelectedMember(null);
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
      return [pseudo, firstName, lastName, lichess, chesscom].some((v) => v?.toLowerCase().includes(s));
    })
    .sort((a, b) => {
      const va = String(a[sortColumn] ?? '').toLowerCase();
      const vb = String(b[sortColumn] ?? '').toLowerCase();
      return va < vb ? (sortDirection === 'asc' ? -1 : 1) : va > vb ? (sortDirection === 'asc' ? 1 : -1) : 0;
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
            <Link href="/" className="hidden items-center gap-1.5 text-sm text-muted transition hover:text-brand sm:inline-flex">
              <ExternalLink className="h-3.5 w-3.5" />
              Classement public
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
          <nav aria-label="Sections administration" className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-none sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 sm:flex-1 sm:gap-2 sm:px-4 sm:py-2.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                  tab === t.id ? 'bg-brand text-white shadow-md' : 'text-gray-600 hover:bg-brand-light hover:text-brand active:scale-[0.98]'
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
                  <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)}>Annuler</Button>
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
                  {membersLoading ? '…' : `${filteredMembers.length} membre${filteredMembers.length !== 1 ? 's' : ''}`}
                </Badge>
              }
            >
              {membersLoading ? (
                <AdminTableSkeleton />
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative max-w-xs flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Rechercher…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        aria-label="Rechercher un membre"
                      />
                    </div>
                  </div>

                  {filteredMembers.length === 0 ? (
                    <EmptyState variant="search" title="Aucun résultat" message="Aucun membre ne correspond à votre recherche." />
                  ) : (
                    <>
                      {/* Mobile cards */}
                      <ul className="divide-y divide-border rounded-lg border border-border sm:hidden">
                        {filteredMembers.map((m) => (
                          <li key={m.id} className="flex items-start gap-3 px-3 py-3">
                            <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                            <div className="min-w-0 flex-1">
                              <button type="button" className="font-medium text-blue hover:underline" onClick={() => void loadMemberResults(m.id)}>
                                {m.pseudo}
                              </button>
                              <p className="truncate text-xs text-muted">{m.firstName} {m.lastName}</p>
                              <p className="mt-0.5 truncate text-[11px] text-muted">
                                {[m.lichess && `♟ ${m.lichess}`, m.chesscom && `♞ ${m.chesscom}`].filter(Boolean).join(' · ') || 'Pas de comptes liés'}
                              </p>
                            </div>
                            <details className="relative shrink-0">
                              <summary
                                className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted hover:bg-gray-100 hover:text-gray-900 [&::-webkit-details-marker]:hidden"
                                aria-label={`Actions pour ${m.pseudo}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </summary>
                              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => void loadMemberResults(m.id)}>
                                  <UserRound className="h-3.5 w-3.5" /> Fiche
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => setEditingMember(m)}>
                                  <Pencil className="h-3.5 w-3.5" /> Modifier
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => void deleteMember(m.id)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                </button>
                              </div>
                            </details>
                          </li>
                        ))}
                      </ul>

                      {/* Desktop table */}
                      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
                        <table className="w-full min-w-[700px] text-left text-sm">
                          <thead>
                            <tr className="bg-brand text-white">
                              {([['pseudo', 'Pseudo'], ['firstName', 'Prénom'], ['lastName', 'Nom'], ['lichess', 'Lichess'], ['chesscom', 'Chess.com']] as [SortColumn, string][]).map(([col, label]) => (
                                <th key={col} className="px-3 py-2.5 font-medium">
                                  <button type="button" onClick={() => sortBy(col)} className="inline-flex items-center gap-1 hover:underline">
                                    {label}
                                    <span className="text-xs opacity-70">{sortColumn === col ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                                  </button>
                                </th>
                              ))}
                              <th className="px-3 py-2.5 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white">
                            {filteredMembers.map((m) => (
                              <tr key={m.id} className="table-row-interactive">
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                                    <button type="button" className="font-medium text-blue hover:underline" onClick={() => void loadMemberResults(m.id)}>{m.pseudo}</button>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-muted">{m.firstName}</td>
                                <td className="px-3 py-2.5 text-muted">{m.lastName}</td>
                                <td className="px-3 py-2.5 text-muted">{m.lichess || '—'}</td>
                                <td className="px-3 py-2.5 text-muted">{m.chesscom || '—'}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex gap-1.5">
                                    <Button size="sm" variant="secondary" onClick={() => setEditingMember(m)}>Modifier</Button>
                                    <Button size="sm" variant="danger" onClick={() => void deleteMember(m.id)}>Supprimer</Button>
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
                action={<Button size="sm" variant="ghost" onClick={() => setSelectedMember(null)}>Fermer</Button>}
              >
                <div className="mb-4 flex flex-wrap gap-3">
                  <Badge variant="brand">{selectedMember.totalPoints} pts championnat</Badge>
                  <Badge variant="gray">{selectedMember.tournamentsPlayed} tournoi{selectedMember.tournamentsPlayed !== 1 ? 's' : ''}</Badge>
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
            <Card title="Créer un tournoi"><TournamentForm /></Card>
            <Card title="Liste des tournois"><TournamentList /></Card>
          </div>
        )}

        {tab === 'import' && (
          <Card title="Importer un classement CSV"><ImportCsvForm /></Card>
        )}
      </main>
    </div>
  );
}