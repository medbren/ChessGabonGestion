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

@Controller('members')
export class UsersController {
  constructor(private service: UsersService) {}

  // Public : permet à l'application mobile de consulter les joueurs.
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Public : permet à l'application mobile d'afficher la fiche joueur.
  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.service.getResults(Number(id));
  }

  // Protégé : réservé à l'administration.
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      pseudo: string;
      lichess?: string;
      chesscom?: string;
    },
  ) {
    return this.service.create(body);
  }

  // Protégé : réservé à l'administration.
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
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
    return this.service.update(Number(id), body);
  }

  // Protégé : réservé à l'administration.
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}