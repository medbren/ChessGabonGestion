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

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// =====================================================
// CONTRÔLEUR DES MEMBRES
// =====================================================
//
// Toutes les routes commencent par :
//
// /members
//
// Exemple :
// GET /members
//
// Ce contrôleur permet de gérer les joueurs de la communauté.
@Controller('members')

// Toutes les routes sont protégées.
// Un utilisateur doit être connecté avec un JWT valide.
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private service: UsersService) {}

  // =====================================================
  // LISTE DES MEMBRES
  // =====================================================
  //
  // GET /members
  //
  // Retourne tous les membres enregistrés.
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // =====================================================
  // HISTORIQUE D'UN JOUEUR
  // =====================================================
  //
  // GET /members/:id/results
  //
  // Exemple :
  // GET /members/5/results
  //
  // Retourne :
  // - informations du joueur
  // - nombre de tournois
  // - total des points
  // - historique complet des résultats
  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.service.getResults(
      Number(id),
    );
  }

  // =====================================================
  // CRÉATION D'UN MEMBRE
  // =====================================================
  //
  // POST /members
  //
  // Exemple :
  //
  // {
  //   "firstName": "Médéric",
  //   "lastName": "NZIE",
  //   "pseudo": "Mederic",
  //   "lichess": "mederic",
  //   "chesscom": "mederic2005"
  // }
  @Post()
  create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      pseudo: string;

      // Pseudo Lichess du joueur.
      lichess?: string;

      // Pseudo Chess.com du joueur.
      chesscom?: string;
    },
  ) {
    return this.service.create(body);
  }

  // =====================================================
  // MODIFICATION D'UN MEMBRE
  // =====================================================
  //
  // PATCH /members/:id
  //
  // Exemple :
  // PATCH /members/3
  //
  // Permet de modifier un joueur existant.
  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      pseudo?: string;
      lichess?: string;
      chesscom?: string;
    },
  ) {
    return this.service.update(
      Number(id),
      body,
    );
  }

  // =====================================================
  // SUPPRESSION D'UN MEMBRE
  // =====================================================
  //
  // DELETE /members/:id
  //
  // Exemple :
  // DELETE /members/7
  //
  // Grâce au Cascade configuré dans Prisma,
  // les résultats du joueur seront également supprimés.
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(
      Number(id),
    );
  }
}