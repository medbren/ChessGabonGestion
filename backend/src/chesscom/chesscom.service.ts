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
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Chess.com HTTP ${res.status} for ${path}`);
      }
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
      '@id': string;
      name: string;
      club_id: number;
      url: string;
      icon?: string;
      location?: string;
      country?: string;
      members_count: number;
      average_daily_rating?: number;
      description?: string;
      join_request?: string;
      visibility?: string;
      created?: number;
      last_activity?: number;
      admin?: string[];
    }>(`/club/${urlId}`);

    return {
      id: raw['@id'],
      name: raw.name,
      clubId: raw.club_id,
      url: raw.url,
      icon: raw.icon,
      location: raw.location,
      country: raw.country,
      membersCount: raw.members_count,
      averageDailyRating: raw.average_daily_rating,
      descriptionHtml: raw.description,
      descriptionText: raw.description ? stripHtml(raw.description) : undefined,
      joinUrl: raw.join_request,
      visibility: raw.visibility,
      createdAt: raw.created
        ? new Date(raw.created * 1000).toISOString()
        : undefined,
      lastActivityAt: raw.last_activity
        ? new Date(raw.last_activity * 1000).toISOString()
        : undefined,
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
    for (const list of [
      members.weekly ?? [],
      members.monthly ?? [],
      members.all_time ?? [],
    ]) {
      for (const m of list) {
        if (m.username) set.add(m.username.toLowerCase());
      }
    }

    return { clubId: profile.club_id, usernames: [...set].sort() };
  }

  async syncMembers(
    options: { createMissing?: boolean } = {},
  ): Promise<SyncMembersResult> {
    const createMissing = options.createMissing === true;
    const urlId = this.getClubUrlId();
    const { clubId, usernames } = await this.fetchClubUsernames();

    const local = await this.prisma.member.findMany({
      select: { id: true, pseudo: true, chesscom: true },
    });

    const byChesscom = new Map<string, (typeof local)[0]>();
    const byPseudo = new Map<string, (typeof local)[0]>();
    for (const m of local) {
      if (m.chesscom) byChesscom.set(m.chesscom.toLowerCase(), m);
      byPseudo.set(m.pseudo.toLowerCase(), m);
    }

    let linked = 0;
    let updated = 0;
    let created = 0;
    const unmatched: string[] = [];

    for (const username of usernames) {
      const key = username.toLowerCase();
      const existing = byChesscom.get(key) ?? byPseudo.get(key);

      if (existing) {
        linked += 1;
        if (!existing.chesscom || existing.chesscom.toLowerCase() !== key) {
          await this.prisma.member.update({
            where: { id: existing.id },
            data: { chesscom: username },
          });
          updated += 1;
          existing.chesscom = username;
          byChesscom.set(key, existing);
        }
        continue;
      }

      if (createMissing) {
        try {
          const createdMember = await this.prisma.member.create({
            data: {
              firstName: username,
              lastName: '(Chess.com)',
              pseudo: username,
              chesscom: username,
            },
          });
          created += 1;
          linked += 1;
          byChesscom.set(key, createdMember);
          byPseudo.set(key, createdMember);
        } catch {
          unmatched.push(username);
        }
      } else {
        unmatched.push(username);
      }
    }

    return {
      clubUrlId: urlId,
      clubId,
      fetched: usernames.length,
      linked,
      updated,
      created,
      unmatched,
      sampleUnmatched: unmatched.slice(0, 30),
    };
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
        if (rest[0] === 'live' && rest[1]) return rest[1];
        if (rest[0]) return rest[0];
      }
      const pubIdx = parts.indexOf('pub');
      if (pubIdx >= 0 && parts[pubIdx + 1] === 'tournament' && parts[pubIdx + 2]) {
        return parts[pubIdx + 2];
      }
    } catch {
      /* fallthrough */
    }
    throw new Error('URL tournoi Chess.com non reconnue.');
  }

  private mapTimeControl(
    timeClass?: string,
  ): 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL' {
    const t = (timeClass ?? '').toLowerCase();
    if (t === 'bullet') return 'BULLET';
    if (t === 'blitz') return 'BLITZ';
    if (t === 'rapid') return 'RAPID';
    return 'CLASSICAL';
  }

  /** Points Swiss pour UNE couleur : win=1, nulle=0.5, défaite=0. */
  private gamePoints(result?: string): number {
    if (!result) return 0;
    const r = result.toLowerCase();
    if (r === 'win') return 1;
    if (
      [
        'agreed',
        'stalemate',
        'repetition',
        'insufficient',
        'timevsinsufficient',
        '50move',
      ].includes(r)
    ) {
      return 0.5;
    }
    return 0;
  }

  private championshipPoints(rank?: number): number {
    if (!rank) return 0;
    const map: Record<number, number> = {
      1: 20,
      2: 16,
      3: 13,
      4: 11,
      5: 9,
      6: 7,
      7: 5,
      8: 4,
      9: 3,
      10: 2,
    };
    return map[rank] ?? 1;
  }

  async fetchTournamentStandings(urlId: string): Promise<{
    name: string;
    url: string;
    date: string;
    timeControl: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
    status: string;
    standings: { rank: number; username: string; points: number }[];
  }> {
    type PlayerSide = { username?: string; result?: string };
    type Game = { white?: PlayerSide; black?: PlayerSide };
    type RoundGroup = { games?: Game[] };
    type RoundMeta = { groups?: string[] };

    const meta = await this.fetchJson<{
      name: string;
      url: string;
      status: string;
      start_time?: number;
      settings?: { total_rounds?: number; time_class?: string };
      players?: { username: string; status?: string }[];
      rounds?: string[];
    }>(`/tournament/${urlId}`);

    const scores = new Map<string, number>();
    for (const p of meta.players ?? []) {
      if (p.username) scores.set(p.username.toLowerCase(), 0);
    }

    const totalRounds =
      meta.settings?.total_rounds ?? meta.rounds?.length ?? 0;

    for (let round = 1; round <= totalRounds; round++) {
      let roundMeta: RoundMeta;
      try {
        roundMeta = await this.fetchJson<RoundMeta>(
          `/tournament/${urlId}/${round}`,
        );
      } catch {
        continue;
      }
      for (const groupUrl of roundMeta.groups ?? []) {
        const path = groupUrl.replace('https://api.chess.com/pub', '');
        let group: RoundGroup;
        try {
          group = await this.fetchJson<RoundGroup>(path);
        } catch {
          continue;
        }
        for (const g of group.games ?? []) {
          const wu = g.white?.username?.toLowerCase();
          const bu = g.black?.username?.toLowerCase();
          if (wu) {
            scores.set(
              wu,
              (scores.get(wu) ?? 0) + this.gamePoints(g.white?.result),
            );
          }
          if (bu) {
            scores.set(
              bu,
              (scores.get(bu) ?? 0) + this.gamePoints(g.black?.result),
            );
          }
        }
      }
    }

    const sorted = [...scores.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    const standings = sorted.map(([username, points], i) => ({
      rank: i + 1,
      username,
      points: Math.round(points * 10) / 10,
    }));

    const date = meta.start_time
      ? new Date(meta.start_time * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return {
      name: meta.name?.trim() || urlId,
      url: meta.url,
      date,
      timeControl: this.mapTimeControl(meta.settings?.time_class),
      status: meta.status,
      standings,
    };
  }

  async importTournament(options: {
    url: string;
    createMissing?: boolean;
  }): Promise<{
    tournamentId: number;
    name: string;
    date: string;
    timeControl: string;
    platform: 'CHESSCOM';
    total: number;
    imported: number;
    createdMembers: number;
    unmatched: string[];
    standingsPreview: { rank: number; username: string; points: number }[];
  }> {
    const createMissing = options.createMissing !== false;
    const urlId = this.parseTournamentUrlId(options.url);
    const data = await this.fetchTournamentStandings(urlId);

    if (!data.standings.length) {
      throw new ServiceUnavailableException(
        'Aucun classement récupérable pour ce tournoi (API).',
      );
    }

    const tournament = await this.prisma.tournament.create({
      data: {
        name: data.name,
        platform: 'CHESSCOM',
        timeControl: data.timeControl,
        date: new Date(data.date),
      },
    });

    const local = await this.prisma.member.findMany({
      select: { id: true, pseudo: true, chesscom: true },
    });
    const byChesscom = new Map<string, (typeof local)[0]>();
    const byPseudo = new Map<string, (typeof local)[0]>();
    for (const m of local) {
      if (m.chesscom) byChesscom.set(m.chesscom.toLowerCase(), m);
      byPseudo.set(m.pseudo.toLowerCase(), m);
    }

    let imported = 0;
    let createdMembers = 0;
    const unmatched: string[] = [];

    for (const row of data.standings) {
      const key = row.username.toLowerCase();
      let member = byChesscom.get(key) ?? byPseudo.get(key);

      if (!member && createMissing) {
        try {
          member = await this.prisma.member.create({
            data: {
              firstName: row.username,
              lastName: '(Chess.com)',
              pseudo: row.username,
              chesscom: row.username,
            },
          });
          createdMembers += 1;
          byChesscom.set(key, member);
          byPseudo.set(key, member);
        } catch {
          unmatched.push(row.username);
          continue;
        }
      }

      if (!member) {
        unmatched.push(row.username);
        continue;
      }

      try {
        await this.prisma.result.create({
          data: {
            memberId: member.id,
            tournamentId: tournament.id,
            points: row.points,
            rank: row.rank,
            championshipPoints: this.championshipPoints(row.rank),
          },
        });
        imported += 1;
      } catch {
        unmatched.push(row.username);
      }
    }

    return {
      tournamentId: tournament.id,
      name: data.name,
      date: data.date,
      timeControl: data.timeControl,
      platform: 'CHESSCOM',
      total: data.standings.length,
      imported,
      createdMembers,
      unmatched,
      standingsPreview: data.standings.slice(0, 10),
    };
  }
}
