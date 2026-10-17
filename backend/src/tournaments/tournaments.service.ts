import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  private calculateChampionshipPoints(rank?: number) {
    if (!rank) return 0;

    const pointsByRank: Record<number, number> = {
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

    return pointsByRank[rank] ?? 1;
  }

  /** Détail public d'un tournoi avec résultats + membres */
  findOne(id: number) {
    return this.prisma.tournament.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: [
            { rank: 'asc' },
            { championshipPoints: 'desc' },
            { points: 'desc' },
          ],
          include: {
            member: {
              select: {
                id: true,
                pseudo: true,
                firstName: true,
                lastName: true,
                chesscom: true,
                lichess: true,
              },
            },
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.tournament.findMany({
      orderBy: {
        date: 'desc',
      },
      include: {
        results: true,
      },
    });
  }

  create(data: {
    name: string;
    platform: 'LICHESS' | 'CHESSCOM' | 'OTHER';
    timeControl: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
    date: string;
  }) {
    return this.prisma.tournament.create({
      data: {
        name: data.name,
        platform: data.platform,
        timeControl: data.timeControl,
        date: new Date(data.date),
      },
    });
  }

  update(
    id: number,
    data: {
      name?: string;
      platform?: 'LICHESS' | 'CHESSCOM' | 'OTHER';
      timeControl?: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
      date?: string;
    },
  ) {
    return this.prisma.tournament.update({
      where: {
        id,
      },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  addResult(
    tournamentId: number,
    data: {
      memberId: number;
      points: number;
      rank?: number;
    },
  ) {
    const championshipPoints = this.calculateChampionshipPoints(data.rank);

    return this.prisma.result.upsert({
      where: {
        memberId_tournamentId: {
          memberId: data.memberId,
          tournamentId,
        },
      },
      create: {
        memberId: data.memberId,
        tournamentId,
        points: data.points,
        rank: data.rank,
        championshipPoints,
      },
      update: {
        points: data.points,
        rank: data.rank,
        championshipPoints,
      },
    });
  }

  delete(id: number) {
    return this.prisma.tournament.delete({
      where: { id },
    });
  }
}
