import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // CALCUL DES POINTS CHAMPIONNAT
  // =====================================================
  //
  // Cette méthode applique le règlement Chess Gabon.
  //
  // Exemple :
  // 1er  -> 20 points
  // 2e   -> 16 points
  // 3e   -> 13 points
  // ...
  // 11e+ -> 1 point
  //
  // Ces points sont utilisés pour les classements annuels.
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

    // Si le rang est supérieur à 10,
    // le joueur reçoit automatiquement 1 point.
    return pointsByRank[rank] ?? 1;
  }

  // =====================================================
  // LISTE DES TOURNOIS
  // =====================================================
  //
  // Retourne tous les tournois triés du plus récent
  // au plus ancien.
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

  // =====================================================
  // CRÉATION D'UN TOURNOI
  // =====================================================
  //
  // Utilisé depuis :
  // - le formulaire admin
  // - l'import CSV
  create(data: {
    name: string;
    platform: 'LICHESS' | 'CHESSCOM' | 'OTHER';
    timeControl: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
    date: string;
  }) {
    return this.prisma.tournament.create({
      data: {
        name: data.name,

        // Plateforme d'origine du tournoi.
        platform: data.platform,

        // Cadence du tournoi.
        timeControl: data.timeControl,

        // Conversion de la date texte vers Date.
        date: new Date(data.date),
      },
    });
  }

  // =====================================================
  // MODIFICATION D'UN TOURNOI
  // =====================================================
  //
  // Permet de modifier un tournoi existant.
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

        // Conversion de la date si elle est fournie.
        date: data.date
          ? new Date(data.date)
          : undefined,
      },
    });
  }

  // =====================================================
  // AJOUT D'UN RÉSULTAT
  // =====================================================
  //
  // Cette méthode est appelée pendant l'import CSV.
  //
  // Exemple :
  // Joueur : Mederic
  // Rang : 3
  // Score : 7.5
  //
  // Résultat :
  // points = 7.5
  // championshipPoints = 13
  addResult(
    tournamentId: number,
    data: {
      memberId: number;
      points: number;
      rank?: number;
    },
  ) {
    // Calcul automatique des points championnat.
    const championshipPoints =
      this.calculateChampionshipPoints(
        data.rank,
      );

    // Upsert :
    // - crée le résultat s'il n'existe pas
    // - met à jour le résultat s'il existe déjà
    return this.prisma.result.upsert({
      where: {
        memberId_tournamentId: {
          memberId: data.memberId,
          tournamentId,
        },
      },

      update: {
        points: data.points,
        rank: data.rank,
        championshipPoints,
      },

      create: {
        memberId: data.memberId,
        tournamentId,

        // Score réel obtenu dans le tournoi.
        points: data.points,

        // Classement obtenu.
        rank: data.rank,

        // Points championnat calculés automatiquement.
        championshipPoints,
      },
    });
  }

  // =====================================================
  // SUPPRESSION D'UN TOURNOI
  // =====================================================
  //
  // Grâce au Cascade défini dans Prisma :
  // - le tournoi est supprimé
  // - tous les résultats associés sont supprimés
  delete(id: number) {
    return this.prisma.tournament.delete({
      where: {
        id,
      },
    });
  }
}