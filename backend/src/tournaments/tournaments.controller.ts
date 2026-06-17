import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// =====================================================
// CONTRÔLEUR DES TOURNOIS
// =====================================================
//
// Toutes les routes de ce contrôleur commencent par :
//
// /tournaments
//
// Exemple :
// GET /tournaments
//
// Ce contrôleur permet de gérer les tournois et leurs résultats.
@Controller('tournaments')

// Toutes les routes sont protégées par JWT.
// Seuls les administrateurs connectés peuvent les utiliser.
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  // =====================================================
  // LISTER LES TOURNOIS
  // =====================================================
  //
  // GET /tournaments
  //
  // Retourne la liste complète des tournois.
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // =====================================================
  // CRÉER UN TOURNOI
  // =====================================================
  //
  // POST /tournaments
  //
  // Exemple :
  //
  // {
  //   "name": "Late Sunday Rapid",
  //   "platform": "LICHESS",
  //   "timeControl": "RAPID",
  //   "date": "2026-06-17"
  // }
  @Post()
  create(
    @Body()
    body: {
      name: string;

      // Plateforme utilisée.
      platform: 'LICHESS' | 'CHESSCOM' | 'OTHER';

      // Cadence du tournoi.
      timeControl:
        | 'BULLET'
        | 'BLITZ'
        | 'RAPID'
        | 'CLASSICAL';

      // Date du tournoi.
      date: string;
    },
  ) {
    return this.service.create(body);
  }

  // =====================================================
  // MODIFIER UN TOURNOI
  // =====================================================
  //
  // PATCH /tournaments/:id
  //
  // Exemple :
  //
  // PATCH /tournaments/3
  //
  // Permet de modifier un tournoi existant.
  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    body: {
      name?: string;

      platform?:
        | 'LICHESS'
        | 'CHESSCOM'
        | 'OTHER';

      timeControl?:
        | 'BULLET'
        | 'BLITZ'
        | 'RAPID'
        | 'CLASSICAL';

      date?: string;
    },
  ) {
    return this.service.update(
      Number(id),
      body,
    );
  }

  // =====================================================
  // AJOUTER UN RÉSULTAT
  // =====================================================
  //
  // POST /tournaments/:id/results
  //
  // Exemple :
  //
  // POST /tournaments/1/results
  //
  // {
  //   "memberId": 5,
  //   "points": 7.5,
  //   "rank": 3
  // }
  //
  // Cette route est utilisée lors de l'import CSV.
  @Post(':id/results')
  addResult(
    @Param('id') id: string,

    @Body()
    body: {
      // Joueur concerné.
      memberId: number;

      // Score réel du tournoi.
      points: number;

      // Rang obtenu.
      rank?: number;
    },
  ) {
    return this.service.addResult(
      Number(id),
      body,
    );
  }

  // =====================================================
  // SUPPRIMER UN TOURNOI
  // =====================================================
  //
  // DELETE /tournaments/:id
  //
  // Exemple :
  //
  // DELETE /tournaments/4
  //
  // Grâce au Cascade défini dans Prisma,
  // tous les résultats du tournoi seront
  // supprimés automatiquement.
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(
      Number(id),
    );
  }
}