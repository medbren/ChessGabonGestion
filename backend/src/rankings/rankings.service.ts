import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // DASHBOARD ADMIN
  // =====================================================
  // Cette méthode retourne les statistiques générales
  // affichées sur le tableau de bord.
  async dashboard() {
    // Nombre total de membres enregistrés.
    const membersCount = await this.prisma.member.count();

    // Nombre total de tournois.
    const tournamentsCount = await this.prisma.tournament.count();

    // Nombre total de résultats enregistrés.
    const resultsCount = await this.prisma.result.count();

    // Dernier tournoi importé ou créé.
    const lastTournament = await this.prisma.tournament.findFirst({
      orderBy: { date: 'desc' },
      include: { results: true },
    });

    // Classement général.
    const topPlayers = await this.findAll({
      type: 'general',
    });

    return {
      membersCount,
      tournamentsCount,
      resultsCount,
      lastTournament,

      // On ne garde que les 5 premiers joueurs.
      topPlayers: topPlayers.slice(0, 5),
    };
  }

  // =====================================================
  // CLASSEMENTS
  // =====================================================
  // Cette méthode construit les classements :
  // - Général
  // - Mensuel
  // - Annuel
  // - Blitz
  // - Rapide
  async findAll(filters: {
    type: 'general' | 'monthly' | 'yearly';
    month?: number;
    year?: number;
    timeControl?: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
  }) {
    const where: any = {};

    // -------------------------------------------------
    // FILTRE MENSUEL
    // -------------------------------------------------
    // Exemple :
    // Juin 2026
    //
    // On sélectionne uniquement les tournois
    // compris entre le 1er juin et le 1er juillet.
    if (filters.type === 'monthly' && filters.month && filters.year) {
      const start = new Date(
        filters.year,
        filters.month - 1,
        1,
      );

      const end = new Date(
        filters.year,
        filters.month,
        1,
      );

      where.tournament = {
        ...(where.tournament || {}),
        date: {
          gte: start,
          lt: end,
        },
      };
    }

    // -------------------------------------------------
    // FILTRE ANNUEL
    // -------------------------------------------------
    // Exemple :
    // Année 2026
    if (filters.type === 'yearly' && filters.year) {
      const start = new Date(filters.year, 0, 1);

      const end = new Date(
        filters.year + 1,
        0,
        1,
      );

      where.tournament = {
        ...(where.tournament || {}),
        date: {
          gte: start,
          lt: end,
        },
      };
    }

    // -------------------------------------------------
    // FILTRE PAR CADENCE
    // -------------------------------------------------
    // Exemple :
    // BLITZ
    // RAPID
    if (filters.timeControl) {
      where.tournament = {
        ...(where.tournament || {}),
        timeControl: filters.timeControl,
      };
    }

    // -------------------------------------------------
    // CHARGEMENT DES JOUEURS
    // -------------------------------------------------
    // On récupère chaque membre avec ses résultats.
    const members = await this.prisma.member.findMany({
      include: {
        results: {
          where,
          include: {
            tournament: true,
          },
        },
      },
    });

    // -------------------------------------------------
    // CALCUL DES CLASSEMENTS
    // -------------------------------------------------
    return members
      .map((member) => {

        // Somme des points championnat.
        //
        // Exemple :
        // 20 + 16 + 9 = 45
        const championshipPoints =
          member.results.reduce(
            (sum, result) =>
              sum + result.championshipPoints,
            0,
          );

        // Somme des scores réels obtenus
        // dans les tournois.
        //
        // Exemple :
        // 8.5 + 7 + 6.5
        const rawPoints =
          member.results.reduce(
            (sum, result) =>
              sum + result.points,
            0,
          );

        return {
          id: member.id,

          // Pseudo principal du joueur.
          pseudo: member.pseudo,

          // Nom complet.
          fullName:
            `${member.firstName} ${member.lastName}`,

          // Points championnat.
          points: championshipPoints,

          // Score brut cumulé.
          rawPoints,

          // Nombre de tournois joués.
          tournaments: member.results.length,
        };
      })

      // On retire les joueurs sans résultat.
      .filter(
        (member) =>
          member.tournaments > 0,
      )

      // -------------------------------------------------
      // TRI DU CLASSEMENT
      // -------------------------------------------------
      // Règlement Chess Gabon :
      //
      // 1. Plus grand nombre de points championnat.
      // 2. Plus grand nombre de participations.
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        return b.tournaments - a.tournaments;
      })

      // Attribution du rang.
      .map((member, index) => ({
        rank: index + 1,
        ...member,
      }));
  }
}