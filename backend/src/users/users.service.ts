import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Retourne tous les membres, triés par pseudo.
  findAll() {
    return this.prisma.member.findMany({
      orderBy: {
        pseudo: 'asc',
      },
    });
  }

  // Retourne la fiche complète d'un joueur :
  // informations personnelles + historique de ses tournois.
  async getResults(id: number) {
    const member = await this.prisma.member.findUnique({
      where: {
        id,
      },
      include: {
        results: {
          include: {
            tournament: true,
          },
          orderBy: {
            tournamentId: 'desc',
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    // Total des scores bruts du joueur.
    const totalPoints = member.results.reduce(
      (sum, result) => sum + result.points,
      0,
    );

    return {
      id: member.id,
      pseudo: member.pseudo,
      firstName: member.firstName,
      lastName: member.lastName,
      lichess: member.lichess,
      chesscom: member.chesscom,
      totalPoints,
      tournamentsPlayed: member.results.length,

      // Liste détaillée des tournois joués par le membre.
      results: member.results.map((result) => ({
        id: result.id,
        points: result.points,
        rank: result.rank,
        tournament: {
          id: result.tournament.id,
          name: result.tournament.name,
          platform: result.tournament.platform,
          timeControl: result.tournament.timeControl,
          date: result.tournament.date,
        },
      })),
    };
  }

  // Crée un nouveau membre.
  create(data: {
    firstName: string;
    lastName: string;
    pseudo: string;
    lichess?: string;
    chesscom?: string;
  }) {
    return this.prisma.member.create({
      data,
    });
  }

  // Modifie un membre existant.
  update(
    id: number,
    data: {
      firstName?: string;
      lastName?: string;
      pseudo?: string;
      lichess?: string;
      chesscom?: string;
    },
  ) {
    return this.prisma.member.update({
      where: {
        id,
      },
      data,
    });
  }

  // Supprime un membre.
  // Les résultats liés sont supprimés automatiquement grâce au onDelete: Cascade.
  delete(id: number) {
    return this.prisma.member.delete({
      where: {
        id,
      },
    });
  }
}