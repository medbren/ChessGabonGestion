import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const membersCount = await this.prisma.member.count();
    const tournamentsCount = await this.prisma.tournament.count();
    const resultsCount = await this.prisma.result.count();
    const lastTournament = await this.prisma.tournament.findFirst({
      orderBy: { date: 'desc' },
      include: { results: true },
    });
    const topPlayers = await this.findAll({ type: 'general' });

    return {
      membersCount,
      tournamentsCount,
      resultsCount,
      lastTournament,
      topPlayers: topPlayers.slice(0, 5),
    };
  }

  async findAll(filters: {
    type: 'general' | 'monthly' | 'yearly';
    month?: number;
    year?: number;
    timeControl?: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
  }) {
    const where: any = {};

    if (filters.type === 'monthly' && filters.month && filters.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 1);
      where.tournament = {
        ...(where.tournament || {}),
        date: { gte: start, lt: end },
      };
    }

    if (filters.type === 'yearly' && filters.year) {
      const start = new Date(filters.year, 0, 1);
      const end = new Date(filters.year + 1, 0, 1);
      where.tournament = {
        ...(where.tournament || {}),
        date: { gte: start, lt: end },
      };
    }

    if (filters.timeControl) {
      where.tournament = {
        ...(where.tournament || {}),
        timeControl: filters.timeControl,
      };
    }

    const members = await this.prisma.member.findMany({
      include: {
        results: {
          where,
          include: { tournament: true },
        },
      },
    });

    return members
      .map((member) => {
        const championshipPoints = member.results.reduce(
          (sum, result) => sum + result.championshipPoints,
          0,
        );
        const rawPoints = member.results.reduce(
          (sum, result) => sum + result.points,
          0,
        );

        return {
          id: member.id,
          pseudo: member.pseudo,
          fullName: `${member.firstName} ${member.lastName}`,
          points: championshipPoints,
          rawPoints,
          tournaments: member.results.length,
          chesscom: member.chesscom ?? null,
        };
      })
      .filter((member) => member.tournaments > 0)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.tournaments !== a.tournaments) return b.tournaments - a.tournaments;
        if (b.rawPoints !== a.rawPoints) return b.rawPoints - a.rawPoints;
        return a.pseudo.localeCompare(b.pseudo, 'fr');
      })
      .map((member, index) => ({
        rank: index + 1,
        ...member,
      }));
  }
}
