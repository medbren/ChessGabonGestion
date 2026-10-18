import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const UA =
  process.env.CHESSCOM_USER_AGENT ??
  'ChessGabonGestion/1.0 (contact: contact@chessgabon.ga)';

export interface ChessComClubProfile {
  id: string;
  name: string;
  clubId: number;
  url: string;
  icon?: string;
  location?: string;
  country?: string;
  membersCount: number;
  averageDailyRating?: number;
  descriptionHtml?: string;
  descriptionText?: string;
  joinUrl?: string;
  visibility?: string;
  createdAt?: string;
  lastActivityAt?: string;
  admins: string[];
}

export interface SyncMembersResult {
  clubUrlId: string;
  clubId: number;
  fetched: number;
  linked: number;
  updated: number;
  created: number;
  unmatched: string[];
  sampleUnmatched: string[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&agrave;/g, 'à')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&rsquo;/g, "'")
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function usernameFromAdminUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

type RoundPayload = {
  groups?: string[];
  games?: {
    white?: { username?: string; result?: string; rating?: number };
    black?: { username?: string; result?: string; rating?: number };
    url?: string;
    end_time?: number;
    pgn?: string;
    eco?: string;
    fen?: string;
  }[];
};

@Injectable()
export class ChessComService {
  private readonly logger = new Logger(ChessComService.name);

  constructor(private prisma: PrismaService) {}

  getClubUrlId(): string {
    return process.env.CHESSCOM_CLUB_URL_ID ?? 'chess-gabon-1';
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `https://api.chess.com/pub${path}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Chess.com HTTP ${res.status} for ${path}`);
      return (await res.json()) as T;
    } catch (e) {
      this.logger.error(`Chess.com fetch failed: ${path}`, e as Error);
      throw new ServiceUnavailableException(
        'Impossible de contacter l’API Chess.com. Réessayez plus tard.',
      );
    }
  }

  async getClubProfile(): Promise<ChessComClubProfile> {
    const urlId = this.getClubUrlId();
    const raw = await this.fetchJson<{
      '@id': string; name: string; club_id: number; url: string; icon?: string;
      location?: string; country?: string; members_count: number;
      average_daily_rating?: number; description?: string; join_request?: string;
      visibility?: string; created?: number; last_activity?: number; admin?: string[];
    }>(`/club/${urlId}`);
    return {
      id: raw['@id'], name: raw.name, clubId: raw.club_id, url: raw.url, icon: raw.icon,
      location: raw.location, country: raw.country, membersCount: raw.members_count,
      averageDailyRating: raw.average_daily_rating, descriptionHtml: raw.description,
      descriptionText: raw.description ? stripHtml(raw.description) : undefined,
      joinUrl: raw.join_request, visibility: raw.visibility,
      createdAt: raw.created ? new Date(raw.created * 1000).toISOString() : undefined,
      lastActivityAt: raw.last_activity ? new Date(raw.last_activity * 1000).toISOString() : undefined,
      admins: (raw.admin ?? []).map(usernameFromAdminUrl),
    };
  }

  async fetchClubUsernames(): Promise<{ clubId: number; usernames: string[] }> {
    const urlId = this.getClubUrlId();
    const profile = await this.fetchJson<{ club_id: number }>(`/club/${urlId}`);
    const members = await this.fetchJson<{
      weekly?: { username: string; joined: number }[];
      monthly?: { username: string; joined: number }[];
      all_time?: { username: string; joined: number }[];
    }>(`/club/${urlId}/members`);
    const set = new Set<string>();
    for (const list of [members.weekly ?? [], members.monthly ?? [], members.all_time ?? []]) {
      for (const m of list) if (m.username) set.add(m.username.toLowerCase());
    }
    return { clubId: profile.club_id, usernames: [...set].sort() };
  }

  async syncMembers(options: { createMissing?: boolean } = {}): Promise<SyncMembersResult> {
    const createMissing = options.createMissing === true;
    const urlId = this.getClubUrlId();
    const { clubId, usernames } = await this.fetchClubUsernames();
    const local = await this.prisma.member.findMany({ select: { id: true, pseudo: true, chesscom: true } });
    const byChesscom = new Map<string, (typeof local)[0]>();
    const byPseudo = new Map<string, (typeof local)[0]>();
    for (const m of local) {
      if (m.chesscom) byChesscom.set(m.chesscom.toLowerCase(), m);
      byPseudo.set(m.pseudo.toLowerCase(), m);
    }
    let linked = 0, updated = 0, created = 0;
    const unmatched: string[] = [];
    for (const username of usernames) {
      const key = username.toLowerCase();
      const existing = byChesscom.get(key) ?? byPseudo.get(key);
      if (existing) {
        linked += 1;
        if (!existing.chesscom || existing.chesscom.toLowerCase() !== key) {
          await this.prisma.member.update({ where: { id: existing.id }, data: { chesscom: username } });
          updated += 1;
          existing.chesscom = username;
          byChesscom.set(key, existing);
        }
        continue;
      }
      if (createMissing) {
        try {
          const createdMember = await this.prisma.member.create({
            data: { firstName: username, lastName: '(Chess.com)', pseudo: username, chesscom: username },
          });
          created += 1; linked += 1;
          byChesscom.set(key, createdMember); byPseudo.set(key, createdMember);
        } catch { unmatched.push(username); }
      } else unmatched.push(username);
    }
    return { clubUrlId: urlId, clubId, fetched: usernames.length, linked, updated, created, unmatched, sampleUnmatched: unmatched.slice(0, 30) };
  }

  parseTournamentUrlId(input: string): string {
    const raw = input.trim();
    if (!raw) throw new Error('URL ou identifiant tournoi manquant.');
    if (!raw.includes('/') && !raw.includes(' ')) return raw;
    try {
      const u = new URL(raw.startsWith('http') ? raw : `https://www.chess.com/${raw}`);
      const parts = u.pathname.split('/').filter(Boolean);
      const tIdx = parts.indexOf('tournament');
      if (tIdx >= 0) {
        const rest = parts.slice(tIdx + 1);
        const skip = new Set(['live', 'arena', 'club', 'tournaments']);
        const slug = [...rest].reverse().find((p) => p && !skip.has(p.toLowerCase()));
        if (slug) return slug;
      }
      const pubIdx = parts.indexOf('pub');
      if (pubIdx >= 0 && parts[pubIdx + 1] === 'tournament' && parts[pubIdx + 2]) return parts[pubIdx + 2];
    } catch { /* */ }
    throw new Error('URL tournoi Chess.com non reconnue.');
  }

  private mapTimeControl(timeClass?: string): 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL' {
    const t = (timeClass ?? '').toLowerCase();
    if (t === 'bullet' || t === 'lightning') return 'BULLET';
    if (t === 'blitz') return 'BLITZ';
    if (t === 'rapid') return 'RAPID';
    return 'CLASSICAL';
  }

  private gamePoints(result?: string): number {
    if (!result) return 0;
    const r = result.toLowerCase();
    if (r === 'win') return 1;
    if (['agreed', 'stalemate', 'repetition', 'insufficient', 'timevsinsufficient', '50move'].includes(r)) return 0.5;
    return 0;
  }

  private isDrawResult(result?: string): boolean {
    if (!result) return false;
    return ['agreed', 'stalemate', 'repetition', 'insufficient', 'timevsinsufficient', '50move'].includes(result.toLowerCase());
  }

  private isArena(meta: { url?: string; settings?: { type?: string } }): boolean {
    const url = (meta.url ?? '').toLowerCase();
    if (url.includes('/arena/')) return true;
    const t = (meta.settings?.type ?? '').toLowerCase();
    if (t === 'swiss') return false;
    return t === 'arena' || t === 'standard';
  }

  /** Arena Chess.com: Win 2, Draw 1, Loss 0; 2e série 3; 3e+ 4. */
  private scoreArena(games: NonNullable<RoundPayload['games']>): Map<string, number> {
    type Ev = { t: number; outcome: 'win' | 'draw' | 'loss' };
    const byPlayer = new Map<string, Ev[]>();
    const push = (username: string | undefined, result: string | undefined, t: number) => {
      if (!username) return;
      const key = username.toLowerCase();
      let outcome: 'win' | 'draw' | 'loss' = 'loss';
      if ((result ?? '').toLowerCase() === 'win') outcome = 'win';
      else if (this.isDrawResult(result)) outcome = 'draw';
      const list = byPlayer.get(key) ?? [];
      list.push({ t, outcome });
      byPlayer.set(key, list);
    };
    for (const g of games) {
      const t = g.end_time ?? 0;
      push(g.white?.username, g.white?.result, t);
      push(g.black?.username, g.black?.result, t);
    }
    const scores = new Map<string, number>();
    for (const [user, events] of byPlayer) {
      events.sort((a, b) => a.t - b.t);
      let pts = 0;
      let streak = 0;
      for (const e of events) {
        if (e.outcome === 'win') {
          streak += 1;
          if (streak === 1) pts += 2;
          else if (streak === 2) pts += 3;
          else pts += 4;
        } else if (e.outcome === 'draw') {
          streak = 0;
          pts += 1;
        } else {
          streak = 0;
        }
      }
      scores.set(user, pts);
    }
    return scores;
  }

  private championshipPoints(rank?: number): number {
    if (!rank) return 0;
    const map: Record<number, number> = { 1: 20, 2: 16, 3: 13, 4: 11, 5: 9, 6: 7, 7: 5, 8: 4, 9: 3, 10: 2 };
    return map[rank] ?? 1;
  }

  private async collectRoundGames(roundPath: string): Promise<NonNullable<RoundPayload['games']>> {
    const roundData = await this.fetchJson<RoundPayload>(roundPath);
    const out: NonNullable<RoundPayload['games']> = [];
    if (roundData.games?.length) {
      out.push(...roundData.games);
      return out;
    }
    for (const groupUrl of roundData.groups ?? []) {
      const groupPath = groupUrl.replace('https://api.chess.com/pub', '');
      try {
        const group = await this.fetchJson<RoundPayload>(groupPath);
        if (group.games?.length) out.push(...group.games);
      } catch { /* skip */ }
    }
    return out;
  }

  async fetchTournamentStandings(urlId: string): Promise<{
    name: string; url: string; date: string;
    timeControl: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
    status: string;
    standings: { rank: number; username: string; points: number }[];
  }> {
    const meta = await this.fetchJson<{
      name: string; url: string; status: string; start_time?: number;
      settings?: { total_rounds?: number; time_class?: string; type?: string };
      players?: { username: string; status?: string }[];
      rounds?: string[];
    }>(`/tournament/${urlId}`);

    const roundUrls = meta.rounds?.length
      ? meta.rounds
      : Array.from({ length: meta.settings?.total_rounds ?? 0 }, (_, i) =>
          `https://api.chess.com/pub/tournament/${urlId}/${i + 1}`,
        );

    const allGames: NonNullable<RoundPayload['games']> = [];
    for (const roundUrl of roundUrls) {
      const roundPath = roundUrl.replace('https://api.chess.com/pub', '');
      try { allGames.push(...(await this.collectRoundGames(roundPath))); }
      catch { /* skip */ }
    }

    let scores: Map<string, number>;
    if (this.isArena(meta)) {
      scores = this.scoreArena(allGames);
      for (const p of meta.players ?? []) {
        if (p.username && !scores.has(p.username.toLowerCase())) scores.set(p.username.toLowerCase(), 0);
      }
    } else {
      scores = new Map<string, number>();
      for (const p of meta.players ?? []) if (p.username) scores.set(p.username.toLowerCase(), 0);
      for (const g of allGames) {
        const wu = g.white?.username?.toLowerCase();
        const bu = g.black?.username?.toLowerCase();
        if (wu) scores.set(wu, (scores.get(wu) ?? 0) + this.gamePoints(g.white?.result));
        if (bu) scores.set(bu, (scores.get(bu) ?? 0) + this.gamePoints(g.black?.result));
      }
    }

    const sorted = [...scores.entries()].sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])));
    const standings = sorted.map(([username, points], i) => ({
      rank: i + 1, username, points: Math.round(points * 10) / 10,
    }));
    const date = meta.start_time
      ? new Date(meta.start_time * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    let name = meta.name?.trim() || urlId;
    if (name.length <= 12 && urlId.includes('-')) {
      const enriched = urlId.replace(/--+/g, '-').replace(/-\d+$/, '').split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (enriched) name = enriched;
    }

    return {
      name, url: meta.url, date,
      timeControl: this.mapTimeControl(meta.settings?.time_class),
      status: meta.status, standings,
    };
  }

  async fetchTournamentGames(urlId: string): Promise<{
    name: string; url: string; status: string; totalGames: number;
    rounds: { round: number; games: {
      white: string; black: string; whiteResult?: string; blackResult?: string;
      whiteRating?: number; blackRating?: number; url?: string; endTime?: string;
      pgn?: string; eco?: string; fen?: string;
    }[] }[];
  }> {
    const meta = await this.fetchJson<{ name?: string; url?: string; status?: string; rounds?: string[] }>(`/tournament/${urlId}`);
    const roundUrls = meta.rounds ?? [];
    const rounds: { round: number; games: {
      white: string; black: string; whiteResult?: string; blackResult?: string;
      whiteRating?: number; blackRating?: number; url?: string; endTime?: string;
      pgn?: string; eco?: string; fen?: string;
    }[] }[] = [];
    let totalGames = 0;
    for (let i = 0; i < roundUrls.length; i++) {
      const roundPath = roundUrls[i].replace('https://api.chess.com/pub', '');
      let rawGames: NonNullable<RoundPayload['games']> = [];
      try { rawGames = await this.collectRoundGames(roundPath); } catch { rawGames = []; }
      const gamesOut: (typeof rounds)[0]['games'] = [];
      for (const g of rawGames) {
        const white = g.white?.username;
        const black = g.black?.username;
        if (!white || !black) continue;
        gamesOut.push({
          white, black,
          whiteResult: g.white?.result, blackResult: g.black?.result,
          whiteRating: g.white?.rating, blackRating: g.black?.rating,
          url: g.url,
          endTime: g.end_time ? new Date(g.end_time * 1000).toISOString() : undefined,
          pgn: g.pgn, eco: g.eco, fen: g.fen,
        });
        totalGames += 1;
      }
      rounds.push({ round: i + 1, games: gamesOut });
    }
    return {
      name: meta.name?.trim() || urlId,
      url: meta.url || `https://www.chess.com/tournament/${urlId}`,
      status: meta.status || 'unknown', totalGames, rounds,
    };
  }

  async importTournament(options: { url: string; createMissing?: boolean }): Promise<{
    tournamentId: number; name: string; date: string; timeControl: string; platform: 'CHESSCOM';
    total: number; imported: number; createdMembers: number; unmatched: string[];
    standingsPreview: { rank: number; username: string; points: number }[];
  }> {
    const createMissing = options.createMissing !== false;
    const urlId = this.parseTournamentUrlId(options.url);
    const data = await this.fetchTournamentStandings(urlId);
    if (!data.standings.length) {
      throw new ServiceUnavailableException('Aucun classement récupérable pour ce tournoi (API).');
    }
    const tournament = await this.prisma.tournament.create({
      data: {
        name: data.name, platform: 'CHESSCOM', timeControl: data.timeControl,
        date: new Date(data.date), externalUrl: data.url || undefined,
      },
    });
    const local = await this.prisma.member.findMany({ select: { id: true, pseudo: true, chesscom: true } });
    const byChesscom = new Map<string, (typeof local)[0]>();
    const byPseudo = new Map<string, (typeof local)[0]>();
    for (const m of local) {
      if (m.chesscom) byChesscom.set(m.chesscom.toLowerCase(), m);
      byPseudo.set(m.pseudo.toLowerCase(), m);
    }
    let imported = 0, createdMembers = 0;
    const unmatched: string[] = [];
    for (const row of data.standings) {
      const key = row.username.toLowerCase();
      let member = byChesscom.get(key) ?? byPseudo.get(key);
      if (!member && createMissing) {
        try {
          member = await this.prisma.member.create({
            data: { firstName: row.username, lastName: '(Chess.com)', pseudo: row.username, chesscom: row.username },
          });
          createdMembers += 1; byChesscom.set(key, member); byPseudo.set(key, member);
        } catch { unmatched.push(row.username); continue; }
      }
      if (!member) { unmatched.push(row.username); continue; }
      try {
        await this.prisma.result.create({
          data: {
            memberId: member.id, tournamentId: tournament.id,
            points: row.points, rank: row.rank,
            championshipPoints: this.championshipPoints(row.rank),
          },
        });
        imported += 1;
      } catch { unmatched.push(row.username); }
    }
    return {
      tournamentId: tournament.id, name: data.name, date: data.date, timeControl: data.timeControl,
      platform: 'CHESSCOM', total: data.standings.length, imported, createdMembers, unmatched,
      standingsPreview: data.standings.slice(0, 10),
    };
  }
}
