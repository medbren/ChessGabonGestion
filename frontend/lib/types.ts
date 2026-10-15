export type Platform = 'LICHESS' | 'CHESSCOM' | 'OTHER';
export type TimeControl = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
export type Role = 'ADMIN' | 'MEMBER';

export interface Player {
  id: string | number;
  rank: number;
  pseudo: string;
  fullName: string;
  points: number;
  rawPoints: number;
  tournaments: number;
}

export interface Member {
  id: number;
  pseudo: string;
  firstName: string;
  lastName: string;
  lichess?: string;
  chesscom?: string;
}

export interface Tournament {
  id: number;
  name: string;
  platform: Platform;
  timeControl: TimeControl;
  date: string;
  results?: unknown[];
}

export interface TournamentResult {
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

export interface MemberDetail extends Member {
  totalPoints: number;
  tournamentsPlayed: number;
  results: TournamentResult[];
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  LICHESS: 'Lichess',
  CHESSCOM: 'Chess.com',
  OTHER: 'Autre',
};

export const TIME_CONTROL_LABELS: Record<TimeControl, string> = {
  BULLET: 'Bullet',
  BLITZ: 'Blitz',
  RAPID: 'Rapide',
  CLASSICAL: 'Classique',
};
