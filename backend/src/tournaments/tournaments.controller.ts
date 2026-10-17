import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Routes :
// GET  /tournaments              — public (liste)
// GET  /tournaments/:id          — public (fiche + résultats)
// POST/PATCH/DELETE              — JWT admin
@Controller('tournaments')
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  // GET /tournaments — public
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // GET /tournaments/:id — public (fiche + classement)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tournament = await this.service.findOne(Number(id));
    if (!tournament) {
      throw new NotFoundException('Tournoi introuvable');
    }
    return tournament;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    body: {
      name: string;
      platform: 'LICHESS' | 'CHESSCOM' | 'OTHER';
      timeControl: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
      date: string;
    },
  ) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      platform?: 'LICHESS' | 'CHESSCOM' | 'OTHER';
      timeControl?: 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';
      date?: string;
    },
  ) {
    return this.service.update(Number(id), body);
  }

  @Post(':id/results')
  @UseGuards(JwtAuthGuard)
  addResult(
    @Param('id') id: string,
    @Body()
    body: {
      memberId: number;
      points: number;
      rank?: number;
    },
  ) {
    return this.service.addResult(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
