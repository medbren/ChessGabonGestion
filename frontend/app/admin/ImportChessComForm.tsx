'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch, clearSession, getToken } from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'loading' | 'preview' | 'importing' | 'success' | 'error';

interface StandingRow {
  rank: number;
  username: string;
  points: number;
}

interface PreviewData {
  urlId: string;
  name: string;
  url: string;
  date: string;
  timeControl: string;
  status: string;
  total: number;
  standings: StandingRow[];
  fetchedAt: string;
}

export default function ImportChessComForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [createMissing, setCreateMissing] = useState(true);
  const [liveRefresh, setLiveRefresh] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleUnauthorized() {
    clearSession();
    toast.error('Session expirée — reconnectez-vous.');
    router.replace('/login');
  }

  function ensureAuth(): boolean {
    if (!getToken()) {
      handleUnauthorized();
      return false;
    }
    return true;
  }

  const loadGames = useCallback(
    async (silent = false) => {
      if (!ensureAuth()) return;
      if (!url.trim()) {
        if (!silent) toast.error('Collez l’URL du tournoi Chess.com.');
        return;
      }
      if (!silent) setStatus('loading');
      try {
        const res = await apiFetch('/chesscom/preview-tournament', {
          method: 'POST',
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = (await res.json().catch(() => ({}))) as PreviewData &
          { message?: string };
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!res.ok) {
          if (!silent) {
            toast.error(data.message || 'Impossible de charger les parties');
            setStatus('error');
          }
          return;
        }
        setPreview(data);
        setStatus('preview');
        if (!silent) {
          toast.success(
            `${data.total} joueurs · statut ${data.status} · ${data.timeControl}`,
          );
        }
      } catch {
        if (!silent) {
          toast.error('Impossible de contacter le serveur');
          setStatus('error');
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url],
  );

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!liveRefresh || !url.trim()) return;

    void loadGames(true);
    intervalRef.current = setInterval(() => {
      void loadGames(true);
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [liveRefresh, url, loadGames]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!ensureAuth()) return;
    if (!url.trim()) {
      toast.error('Collez l’URL du tournoi Chess.com.');
      return;
    }
    setStatus('importing');
    setSummary(null);
    try {
      const res = await apiFetch('/chesscom/import-tournament', {
        method: 'POST',
        body: JSON.stringify({
          url: url.trim(),
          createMissing,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        name?: string;
        imported?: number;
        total?: number;
        createdMembers?: number;
        timeControl?: string;
        date?: string;
      };
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        toast.error(data.message || 'Échec de l’import Chess.com');
        setStatus('error');
        return;
      }
      const msg = `« ${data.name} » — ${data.imported}/${data.total} résultats · ${data.createdMembers ?? 0} membres créés · ${data.timeControl} · ${data.date}`;
      setSummary(msg);
      toast.success(msg);
      setStatus('success');
      setLiveRefresh(false);
    } catch {
      toast.error('Impossible de contacter le serveur');
      setStatus('error');
    }
  }

  const busy = status === 'loading' || status === 'importing';
  const isLive =
    preview?.status === 'in_progress' ||
    preview?.status === 'registration' ||
    liveRefresh;

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <p className="text-sm text-muted">
        Collez l’URL d’un tournoi Chess.com. Chargez d’abord les parties en
        temps réel pour prévisualiser le classement, puis importez en base.
      </p>

      <Input
        id="cc-url"
        name="url"
        label="URL du tournoi"
        placeholder="https://www.chess.com/tournament/live/samedi-blitz--31136531"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setPreview(null);
          setSummary(null);
        }}
        disabled={busy}
        required
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={status === 'loading'}
          disabled={busy || !url.trim()}
          onClick={() => void loadGames(false)}
        >
          {status === 'loading' ? 'Chargement…' : 'Charger les parties'}
        </Button>
        <Button type="submit" loading={status === 'importing'} disabled={busy}>
          {status === 'importing' ? 'Import…' : 'Importer en base'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={createMissing}
            onChange={(e) => setCreateMissing(e.target.checked)}
            className="rounded border-border"
            disabled={busy}
          />
          Créer les membres absents
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={liveRefresh}
            onChange={(e) => setLiveRefresh(e.target.checked)}
            className="rounded border-border"
            disabled={busy || !url.trim()}
          />
          Rafraîchir toutes les 15 s (live)
        </label>
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-gray-900">{preview.name}</p>
              <p className="text-xs text-muted">
                {preview.date} · {preview.timeControl} ·{' '}
                <span
                  className={cn(
                    'font-medium',
                    isLive ? 'text-brand' : 'text-gray-600',
                  )}
                >
                  {preview.status}
                </span>
                {preview.fetchedAt ? (
                  <>
                    {' '}
                    · maj{' '}
                    {new Date(preview.fetchedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </>
                ) : null}
              </p>
            </div>
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">
              {preview.total} joueur{preview.total !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Rang</th>
                  <th className="px-3 py-2 font-medium">Joueur</th>
                  <th className="px-3 py-2 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.standings.map((row) => (
                  <tr key={row.username} className="hover:bg-gray-50/80">
                    <td className="px-3 py-1.5 tabular-nums text-muted">
                      {row.rank}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">
                      {row.username}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary ? (
        <p className="rounded-lg border border-brand/30 bg-brand-light px-3 py-2 text-sm text-brand-dark">
          {summary}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Le classement est recalculé à partir des parties publiées par l’API
        Chess.com. Tournois club :{' '}
        <a
          href="https://www.chess.com/clubs/pastevents/chess-gabon-1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Past Events
        </a>
        .
      </p>
    </form>
  );
}
