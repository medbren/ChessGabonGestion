import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChessComService } from './chesscom.service';

@Controller('chesscom')
export class ChessComController {
  constructor(private service: ChessComService) {}

  /**
   * Public — parties d'un tournoi Chess.com (fetch live).
   * Query : url= lien ou id tournoi Chess.com
   */
  @Get('tournament-games')
  async tournamentGames(@Query('url') url?: string) {
    if (!url?.trim()) {
      throw new BadRequestException(
        'Paramètre url requis (lien ou id du tournoi Chess.com).',
      );
    }
    try {
      const urlId = this.service.parseTournamentUrlId(url);
      return await this.service.fetchTournamentGames(urlId);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = e instanceof Error ? e.message : 'Chargement impossible';
      throw new BadRequestException(msg);
    }
  }

  /** Public — profil club pour /a-propos */
  @Get('club')
  getClub() {
    return this.service.getClubProfile();
  }

  @Post('sync-members')
  @UseGuards(JwtAuthGuard)
  syncMembers(@Body() body: { createMissing?: boolean }) {
    return this.service.syncMembers({
      createMissing: body?.createMissing === true,
    });
  }

  @Post('preview-tournament')
  @UseGuards(JwtAuthGuard)
  async previewTournament(@Body() body: { url?: string }) {
    if (!body?.url?.trim()) {
      throw new BadRequestException(
        'Champ url requis (lien du tournoi Chess.com).',
      );
    }
    try {
      const urlId = this.service.parseTournamentUrlId(body.url);
      const data = await this.service.fetchTournamentStandings(urlId);
      return {
        urlId,
        name: data.name,
        url: data.url,
        date: data.date,
        timeControl: data.timeControl,
        status: data.status,
        total: data.standings.length,
        standings: data.standings,
        fetchedAt: new Date().toISOString(),
      };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = e instanceof Error ? e.message : 'Chargement impossible';
      throw new BadRequestException(msg);
    }
  }

  @Post('import-tournament')
  @UseGuards(JwtAuthGuard)
  async importTournament(
    @Body() body: { url?: string; createMissing?: boolean },
  ) {
    if (!body?.url?.trim()) {
      throw new BadRequestException(
        'Champ url requis (lien du tournoi Chess.com).',
      );
    }
    try {
      return await this.service.importTournament({
        url: body.url,
        createMissing: body.createMissing !== false,
      });
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      const msg = e instanceof Error ? e.message : 'Import impossible';
      throw new BadRequestException(msg);
    }
  }
}
