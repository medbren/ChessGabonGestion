'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Member, Platform, TimeControl } from '@/lib/types';

type CsvRow = { rank: number; pseudo: string; points: number };
type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

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
  const rankIndex = findIndex(headers, 'rank', 'Rank', 'Rk');
  const pseudoIndex = findIndex(headers, 'pseudo', 'Username');
  const pointsIndex = findIndex(headers, 'points', 'Points', 'Score');

  if (rankIndex === -1 || pseudoIndex === -1 || pointsIndex === -1) {
    throw new Error('Format CSV non reconnu. Vérifiez les en-têtes.');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    return {
      rank: Number(cols[rankIndex]),
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
    const lichess = m.lichess?.toLowerCase();
    const chesscom = m.chesscom?.toLowerCase();
    if (platform === 'LICHESS') return lichess === p || internal === p;
    if (platform === 'CHESSCOM') return chesscom === p || internal === p;
    return internal === p;
  });
}

export default function ImportCsvForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [fileName, setFileName] = useState('');

  async function importCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('csv') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      toast.error('Aucun fichier sélectionné.');
      return;
    }

    setImportStatus('loading');
    setProgress(null);

    try {
      const platform = (form.elements.namedItem('platform') as HTMLSelectElement).value as Platform;
      const timeControl = (form.elements.namedItem('timeControl') as HTMLSelectElement).value as TimeControl;
      const name = (form.elements.namedItem('name') as HTMLInputElement).value;
      const date = (form.elements.namedItem('date') as HTMLInputElement).value;

      const tournamentRes = await apiFetch('/tournaments', {
        method: 'POST',
        body: JSON.stringify({ name, platform, timeControl, date }),
      });
      if (!tournamentRes.ok) {
        toast.error('Erreur lors de la création du tournoi.');
        setImportStatus('error');
        return;
      }
      const tournament = (await tournamentRes.json()) as { id: number };

      const text = await file.text();
      const rows = parseCsv(text);

      const membersRes = await apiFetch('/members');
      if (!membersRes.ok) {
        toast.error('Erreur lors du chargement des membres.');
        setImportStatus('error');
        return;
      }
      const members: Member[] = await membersRes.json();

      setProgress({ done: 0, total: rows.length });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let member = findExistingMember(members, platform, row.pseudo);

        if (!member) {
          const createRes = await apiFetch('/members', {
            method: 'POST',
            body: JSON.stringify({
              firstName: row.pseudo,
              lastName: '',
              pseudo: row.pseudo,
              lichess: platform === 'LICHESS' ? row.pseudo : '',
              chesscom: platform === 'CHESSCOM' ? row.pseudo : '',
            }),
          });
          if (!createRes.ok) {
            toast.error(`Erreur lors de la création du membre "${row.pseudo}".`);
            setImportStatus('error');
            return;
          }
          member = (await createRes.json()) as Member;
          members.push(member);
        }

        const resultRes = await apiFetch(`/tournaments/${tournament.id}/results`, {
          method: 'POST',
          body: JSON.stringify({
            memberId: member.id,
            points: row.points,
            rank: row.rank,
          }),
        });
        if (!resultRes.ok) {
          toast.error(`Erreur lors de l'ajout du résultat pour "${row.pseudo}".`);
          setImportStatus('error');
          return;
        }

        setProgress({ done: i + 1, total: rows.length });
      }

      toast.success(
        `Import terminé — ${rows.length} résultat${rows.length > 1 ? 's' : ''} importé${rows.length > 1 ? 's' : ''}.`
      );
      setImportStatus('success');
      setFileName('');
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur pendant l'import.");
      setImportStatus('error');
    } finally {
      setProgress(null);
    }
  }

  const isLoading = importStatus === 'loading';
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Formats acceptés
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['Générique', 'rank, pseudo, points'],
            ['Lichess', 'Rank, Username, Points'],
            ['Chess.com', 'Rk, Username, Score'],
          ].map(([label, cols]) => (
            <div key={label} className="rounded-lg border border-border bg-white px-3 py-2">
              <p className="text-xs font-medium text-gray-700">{label}</p>
              <code className="text-[11px] text-muted">{cols}</code>
            </div>
          ))}
        </div>
      </div>

      <form ref={formRef} onSubmit={importCsv} className="space-y-4">
        <Input id="ic-name" name="name" label="Nom du tournoi" placeholder="Blitz du dimanche #12" required disabled={isLoading} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select id="ic-platform" name="platform" label="Plateforme" disabled={isLoading}>
            <option value="LICHESS">Lichess</option>
            <option value="CHESSCOM">Chess.com</option>
            <option value="OTHER">Autre / CSV générique</option>
          </Select>
          <Select id="ic-timeControl" name="timeControl" label="Cadence" disabled={isLoading}>
            <option value="BULLET">Bullet</option>
            <option value="BLITZ">Blitz</option>
            <option value="RAPID">Rapide</option>
            <option value="CLASSICAL">Classique</option>
          </Select>
        </div>
        <Input id="ic-date" name="date" type="date" label="Date du tournoi" required disabled={isLoading} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ic-csv" className="text-xs font-medium text-gray-600">Fichier CSV</label>
          <label
            htmlFor="ic-csv"
            className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm transition hover:border-brand ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <span className="text-lg">📂</span>
            <span className={fileName ? 'text-gray-900' : 'text-muted'}>
              {fileName || 'Choisir un fichier .csv…'}
            </span>
          </label>
          <input
            id="ic-csv"
            name="csv"
            type="file"
            accept=".csv"
            required
            disabled={isLoading}
            className="hidden"
            onChange={(ev) => setFileName(ev.target.files?.[0]?.name ?? '')}
          />
        </div>

        {isLoading && progress && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {progress.done} / {progress.total} résultats importés…
            </p>
          </div>
        )}

        <Button type="submit" loading={isLoading}>
          {isLoading ? 'Import en cours…' : '↑ Importer le fichier'}
        </Button>
      </form>
    </div>
  );
}